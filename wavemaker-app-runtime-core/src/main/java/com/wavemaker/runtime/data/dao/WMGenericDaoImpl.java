package com.wavemaker.runtime.data.dao;

import java.io.Serializable;
import java.lang.reflect.ParameterizedType;
import java.sql.Date;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.Collection;
import java.util.Iterator;

import javax.annotation.PostConstruct;

import org.hibernate.Criteria;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.criterion.*;
import org.hibernate.type.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate4.HibernateCallback;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.wavemaker.runtime.data.expression.AttributeType;
import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.data.spring.WMPageImpl;
import com.wavemaker.studio.common.ser.WMDateDeSerializer;
import com.wavemaker.studio.common.ser.WMLocalDateTimeDeSerializer;

public abstract class WMGenericDaoImpl<Entity extends Serializable, Identifier extends Serializable> implements WMGenericDao<Entity, Identifier> {

    private Class<Entity> entityClass;

    public abstract HibernateTemplate getTemplate();

    @SuppressWarnings("unchecked")
    @PostConstruct
    public void init() {
        if (getTemplate() == null)
            throw new RuntimeException("hibernate template is not set.");

        ParameterizedType genericSuperclass = (ParameterizedType) getClass().getGenericSuperclass();
        this.entityClass = (Class<Entity>) genericSuperclass.getActualTypeArguments()[0];
    }

    public Entity create(Entity entity) {
        Identifier identifier = (Identifier) getTemplate().save(entity);
        return findById(identifier);
    }

    public void update(Entity entity) {
        getTemplate().update(entity);
        getTemplate().flush();
    }

    public void delete(Entity entity) {
        getTemplate().delete(entity);
    }

    public Entity findById(Identifier entityId) {
        return getTemplate().get(entityClass, entityId);
    }

    public Page getAssociatedObjects(final Object value, final String entityName, final String key, final Pageable pageable) {
        return getTemplate().execute(new HibernateCallback<Page>() {
            @Override
            public Page doInHibernate(Session session) throws HibernateException {
                Criteria criteria = session.createCriteria(entityClass).createCriteria(entityName);
                criteria.add(Restrictions.eq(key, value));
                return executeAndGetPageableData(criteria, pageable);
            }
        });
    }

    public Page<Entity> list() {
        return search(null, null);
    }

    public Page<Entity> search(final QueryFilter queryFilters[], final Pageable pageable) {
        validateQueryFilters(queryFilters);

        return getTemplate().execute(new HibernateCallback<Page>() {
            @Override
            public Page doInHibernate(Session session) throws HibernateException {
                Criteria criteria = session.createCriteria(entityClass);
                if (queryFilters != null && queryFilters.length > 0) {
                    for (QueryFilter queryFilter : queryFilters) {
                        Criterion criterion = createCriterion(queryFilter);
                        criteria.add(criterion);
                    }
                }
                return executeAndGetPageableData(criteria, pageable);
            }
        });
    }

    protected Criterion createCriterion(QueryFilter queryFilter) {
        Criterion criterion = null;
        Object attributeValue = queryFilter.getAttributeValue();
        String attributeName = queryFilter.getAttributeName();
        switch (queryFilter.getFilterCondition()) {
            case EQUALS:
                if (attributeValue instanceof Collection) {
                    criterion = Restrictions.in(attributeName, (Collection) attributeValue);
                } else if (attributeValue.getClass().isArray()) {
                    criterion = Restrictions.in(attributeName, (Object[]) attributeValue);
                } else {
                    criterion = Restrictions.eq(attributeName, attributeValue);
                }
                break;
            case STARTING_WITH:
                criterion = Restrictions.ilike(attributeName, String.valueOf(attributeValue), MatchMode.START);
                break;
            case ENDING_WITH:
                criterion = Restrictions.ilike(attributeName, String.valueOf(attributeValue), MatchMode.END);
                break;
            case CONTAINING:
                criterion = Restrictions.ilike(attributeName, String.valueOf(attributeValue), MatchMode.ANYWHERE);
                break;
            default:
                throw new RuntimeException("Unhandled filter condition: " + queryFilter.getFilterCondition());
        }
        return criterion;
    }

    private Page executeAndGetPageableData(Criteria criteria, Pageable pageable) {
        if (pageable != null) {
            long count = getRowCount(criteria);
            updateCriteriaForPageable(criteria, pageable);
            return new WMPageImpl(criteria.list(), pageable, count);
        } else {
            return new WMPageImpl(criteria.list());
        }
    }

    private Long getRowCount(Criteria countCriteria) {
        //set the projection
        countCriteria.setProjection(Projections.rowCount());

        Long count;
        try {
            count = (Long) countCriteria.uniqueResult();
        } finally {
            //unset the projection
            countCriteria.setProjection(null);
        }
        return count;
    }

    protected void updateCriteriaForPageable(Criteria criteria, Pageable pageable) {
        criteria.setFirstResult(pageable.getOffset());
        criteria.setMaxResults(pageable.getPageSize());
        if (pageable.getSort() != null) {
            Iterator<Sort.Order> iterator = pageable.getSort().iterator();
            while (iterator.hasNext()) {
                Sort.Order order = iterator.next();
                if (order.getDirection().equals(Sort.Direction.DESC)) {
                    criteria.addOrder(Order.desc(order.getProperty()));
                } else {
                    criteria.addOrder(Order.asc(order.getProperty()));
                }
            }
        }
    }

    private void validateQueryFilters(QueryFilter[] queryFilters) {
        if (queryFilters != null && queryFilters.length > 0) {
            for (QueryFilter queryFilter : queryFilters) {
                Object attributeValue = queryFilter.getAttributeValue();
                AttributeType attributeType = queryFilter.getAttributeType();
                if (attributeValue instanceof Collection) {
                    Collection collection = (Collection) attributeValue;
                    Object[] objects = collection.toArray(new Object[]{});
                    queryFilter.setAttributeValue(Arrays.asList(updateObjectsArray(objects, attributeType)));
                } else if (attributeValue.getClass().isArray()) {
                    Object[] objects = (Object[]) attributeValue;
                    objects = updateObjectsArray(objects, attributeType);
                    queryFilter.setAttributeValue(objects);
                } else {
                    queryFilter.setAttributeValue(getUpdatedAttributeValue(attributeValue, attributeType));
                }
            }
        }
    }

    private Object[] updateObjectsArray(Object[] objects, AttributeType attributeType) {
        for (int i = 0; i < objects.length; i++) {
            objects[i] = getUpdatedAttributeValue(objects[i], attributeType);
        }
        return objects;
    }

    private Object getUpdatedAttributeValue(Object attributeValue, AttributeType attributeType) {
        switch (attributeType) {
            case BIG_DECIMAL:
                return BigDecimalType.INSTANCE.fromString(attributeValue.toString());
            case BIG_INTEGER:
                return BigIntegerType.INSTANCE.fromString(attributeValue.toString());
            case BLOB:
                return BlobType.INSTANCE.fromString(attributeValue.toString());
            case BOOLEAN:
                return BooleanType.INSTANCE.fromString(attributeValue.toString());
            case BYTE:
                return ByteType.INSTANCE.fromString(attributeValue.toString());
            case CHARACTER:
                return CharacterType.INSTANCE.fromString(attributeValue.toString());
            case CURRENCY:
                return CurrencyType.INSTANCE.fromString(attributeValue.toString());
            case DATE:
                if (attributeValue instanceof Number) {
                    return new java.sql.Date(((Number) attributeValue).longValue());
                } else {
                    return WMDateDeSerializer.getDate((String) attributeValue);
                }
            case DOUBLE:
                return DoubleType.INSTANCE.fromString(attributeValue.toString());
            case FLOAT:
                return FloatType.INSTANCE.fromString(attributeValue.toString());
            case INTEGER:
                return IntegerType.INSTANCE.fromString(attributeValue.toString());
            case LOCALE:
                return LocaleType.INSTANCE.fromString(attributeValue.toString());
            case TIMEZONE:
                return TimeZoneType.INSTANCE.fromString(attributeValue.toString());
            case TRUE_FALSE:
                return TrueFalseType.INSTANCE.fromString(attributeValue.toString());
            case YES_NO:
                return YesNoType.INSTANCE.fromString(attributeValue.toString());
            case CLOB:
                return ClobType.INSTANCE.fromString(attributeValue.toString());
            case STRING:
                return StringType.INSTANCE.fromString(attributeValue.toString());
            case SHORT:
                return ShortType.INSTANCE.fromString(attributeValue.toString());
            case TEXT:
                return TextType.INSTANCE.fromString(attributeValue.toString());
            case TIME:
                if (attributeValue instanceof Number) {
                    return new java.sql.Time(((Number) attributeValue).longValue());
                } else {
                    return WMDateDeSerializer.getDate((String) attributeValue);
                }
            case DATETIME:
                return WMLocalDateTimeDeSerializer.getLocalDateTime((String) attributeValue);
            case TIMESTAMP:
                return new Timestamp(((Number) attributeValue).longValue());
            case CALENDAR:
                return new Date(((Number) attributeValue).longValue());
            case CALENDAR_DATE:
                return new Date(((Number) attributeValue).longValue());
        }
        return attributeValue;
    }

    @Override
    public Page<Entity> list(Pageable pageable) {
        return search(null, pageable);
    }

    @Override
    public long count() {
        return getTemplate().execute(new HibernateCallback<Long>() {
            @Override
            public Long doInHibernate(Session session) throws HibernateException {
                Criteria criteria = session.createCriteria(entityClass);
                return getRowCount(criteria);
            }
        });
    }
}
