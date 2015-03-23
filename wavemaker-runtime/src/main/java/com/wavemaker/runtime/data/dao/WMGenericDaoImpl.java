package com.wavemaker.runtime.data.dao;

import java.io.Serializable;
import java.lang.reflect.ParameterizedType;
import java.sql.Date;
import java.sql.Timestamp;
import java.util.Iterator;

import javax.annotation.PostConstruct;

import org.hibernate.Criteria;
import org.hibernate.criterion.MatchMode;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Projections;
import org.hibernate.criterion.Restrictions;
import org.hibernate.type.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.data.spring.WMPageImpl;

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

    public Page getAssociatedObjects(Object value, String entityName, String key, Pageable pageable) {

        Criteria criteria = getTemplate().getSessionFactory().getCurrentSession().createCriteria(entityClass).createCriteria(entityName);
        Criteria countCriteria = getTemplate().getSessionFactory().getCurrentSession().createCriteria(entityClass).createCriteria(entityName);
        criteria.add(Restrictions.eq(key, value));
        countCriteria.add(Restrictions.eq(key, value));
        if (pageable != null) {
            Long count = getRowCount(countCriteria);
            criteria = prepareCriteriaForPageable(criteria, pageable);
            return new WMPageImpl(criteria.list(), pageable, count);

        } else
            return new WMPageImpl(criteria.list());

    }

    public Page<Entity> list() {
        return new WMPageImpl<Entity>(getTemplate().loadAll(entityClass));
    }

    public Page<Entity> search(QueryFilter queryFilters[], Pageable pageable) {
        validateQueryFilters(queryFilters);
        Criteria criteria = getTemplate().getSessionFactory().getCurrentSession().createCriteria(entityClass);
        Criteria countCriteria = getTemplate().getSessionFactory().getCurrentSession().createCriteria(entityClass);
        if (queryFilters != null && queryFilters.length > 0) {
            for (QueryFilter queryFilter : queryFilters) {
                switch (queryFilter.getFilterCondition()) {
                    case EQUALS:
                        criteria.add(Restrictions.eq(queryFilter.getAttributeName(), queryFilter.getAttributeValue()));
                        countCriteria.add(Restrictions.eq(queryFilter.getAttributeName(), queryFilter.getAttributeValue()));
                        break;
                    case STARTING_WITH:
                        criteria.add(Restrictions.ilike(queryFilter.getAttributeName(), String.valueOf(queryFilter.getAttributeValue()), MatchMode.START));
                        countCriteria.add(Restrictions.ilike(queryFilter.getAttributeName(), String.valueOf(queryFilter.getAttributeValue()), MatchMode.START));
                        break;
                    case ENDING_WITH:
                        criteria.add(Restrictions.ilike(queryFilter.getAttributeName(), String.valueOf(queryFilter.getAttributeValue()), MatchMode.END));
                        countCriteria.add(Restrictions.ilike(queryFilter.getAttributeName(), String.valueOf(queryFilter.getAttributeValue()), MatchMode.END));
                        break;
                    case CONTAINING:
                        criteria.add(Restrictions.ilike(queryFilter.getAttributeName(), String.valueOf(queryFilter.getAttributeValue()), MatchMode.ANYWHERE));
                        countCriteria.add(Restrictions.ilike(queryFilter.getAttributeName(), String.valueOf(queryFilter.getAttributeValue()), MatchMode.ANYWHERE));
                        break;
                    default:
                        throw new RuntimeException("Unhandled filter condition: " + queryFilter.getFilterCondition());
                }
            }
        }
        if (pageable != null) {
            Long count = getRowCount(countCriteria);
            criteria = prepareCriteriaForPageable(criteria, pageable);
            return new WMPageImpl<Entity>(criteria.list(), pageable, count);

        } else
            return new WMPageImpl<Entity>(criteria.list());
    }

    private Long getRowCount(Criteria countCriteria) {
        countCriteria.setProjection(Projections.rowCount());
        Long count = (Long) countCriteria.uniqueResult();
        return count;
    }


    private Criteria prepareCriteriaForPageable(Criteria criteria, Pageable pageable) {
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
        return criteria;
    }

    private void validateQueryFilters(QueryFilter[] queryFilters) {
        if (queryFilters != null && queryFilters.length > 0) {
            for (QueryFilter queryFilter : queryFilters) {
                switch (queryFilter.getAttributeType()) {
                    case BIG_DECIMAL:
                        queryFilter.setAttributeValue(BigDecimalType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case BIG_INTEGER:
                        queryFilter.setAttributeValue(BigIntegerType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case BLOB:
                        queryFilter.setAttributeValue(BlobType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case BOOLEAN:
                        queryFilter.setAttributeValue(BooleanType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case BYTE:
                        queryFilter.setAttributeValue(ByteType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case CHARACTER:
                        queryFilter.setAttributeValue(CharacterType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case CURRENCY:
                        queryFilter.setAttributeValue(CurrencyType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case DATE:
                        queryFilter.setAttributeValue(new Date(((Number) queryFilter.getAttributeValue()).longValue()));
                        break;
                    case DOUBLE:
                        queryFilter.setAttributeValue(DoubleType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case FLOAT:
                        queryFilter.setAttributeValue(FloatType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case INTEGER:
                        queryFilter.setAttributeValue(IntegerType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case LOCALE:
                        queryFilter.setAttributeValue(LocaleType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case TIMEZONE:
                        queryFilter.setAttributeValue(TimeZoneType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case TRUE_FALSE:
                        queryFilter.setAttributeValue(TrueFalseType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case YES_NO:
                        queryFilter.setAttributeValue(YesNoType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case CLOB:
                        queryFilter.setAttributeValue(ClobType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case STRING:
                        queryFilter.setAttributeValue(StringType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case SHORT:
                        queryFilter.setAttributeValue(ShortType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case TEXT:
                        queryFilter.setAttributeValue(TextType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;

                    case TIME:
                        queryFilter.setAttributeValue(TimeType.INSTANCE.fromString(queryFilter.getAttributeValue().toString()));
                        break;
                    case TIMESTAMP:
                        queryFilter.setAttributeValue(new Timestamp(((Number) queryFilter.getAttributeValue()).longValue()));
                        break;
                    case CALENDAR:
                        queryFilter.setAttributeValue(new Date(((Number) queryFilter.getAttributeValue()).longValue()));
                        break;
                    case CALENDAR_DATE:
                        queryFilter.setAttributeValue(new Date(((Number) queryFilter.getAttributeValue()).longValue()));
                        break;
                }
            }
        }

    }

    @Override
    public Page<Entity> list(Pageable pageable) {
        return search(null, pageable);
    }

    @Override
    public long count() {
        return getTemplate().loadAll(entityClass).size();
    }
}
