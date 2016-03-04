/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.dao;

import java.io.Serializable;
import java.lang.reflect.ParameterizedType;
import java.util.Arrays;
import java.util.Collection;
import java.util.Iterator;

import javax.annotation.PostConstruct;

import org.hibernate.Criteria;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Projections;
import org.hibernate.criterion.Restrictions;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate4.HibernateCallback;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.wavemaker.runtime.data.expression.AttributeType;
import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.data.expression.Type;
import com.wavemaker.runtime.data.spring.WMPageImpl;

public abstract class WMGenericDaoImpl<Entity extends Serializable, Identifier extends Serializable> implements WMGenericDao<Entity, Identifier> {

    public static final String SEARCH_PROPERTY_DILIMITTER = ".";
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
                        final String attributeName = queryFilter.getAttributeName();

                        // if search filter contains related table property, then add entity alias to criteria to perform search on related properties.
                        criteria = criteriaForRelatedProperty(criteria, attributeName);

                        Criterion criterion = createCriterion(queryFilter);
                        criteria.add(criterion);
                    }
                }
                return executeAndGetPageableData(criteria, pageable);
            }
        });
    }

    protected Criterion createCriterion(QueryFilter queryFilter) {
        Object attributeValue = queryFilter.getAttributeValue();
        String attributeName = queryFilter.getAttributeName();
        return queryFilter.getFilterCondition().criterion(attributeName, attributeValue);
    }

    protected void updateCriteriaForPageable(Criteria criteria, Pageable pageable) {
            criteria.setFirstResult(pageable.getOffset());
            criteria.setMaxResults(pageable.getPageSize());
            if (pageable.getSort() != null) {
                Iterator<Sort.Order> iterator = pageable.getSort().iterator();
                while (iterator.hasNext()) {
                    Sort.Order order = iterator.next();
                    final String property = order.getProperty();
                    criteriaForRelatedProperty(criteria, property);
                    if (order.getDirection().equals(Sort.Direction.DESC)) {
                        criteria.addOrder(Order.desc(property));
                    } else {
                        criteria.addOrder(Order.asc(property));
                    }
                }
            }
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
            countCriteria.setResultTransformer(Criteria.ROOT_ENTITY);
        }
        return count;
    }

    private Criteria criteriaForRelatedProperty(Criteria criteria, final String attributeName) {
        final int indexOfDot = attributeName.indexOf(SEARCH_PROPERTY_DILIMITTER);
        if (indexOfDot != -1) {
            String relatedEntityName = attributeName.substring(0, indexOfDot);
            criteria = criteria.createAlias(relatedEntityName, relatedEntityName);
        }
        return criteria;
    }

    private void validateQueryFilters(QueryFilter[] queryFilters) {
        if (queryFilters != null && queryFilters.length > 0) {
            for (QueryFilter queryFilter : queryFilters) {
                Object attributeValue = queryFilter.getAttributeValue();
                if (attributeValue == null || queryFilter.getFilterCondition() == Type.NULL)
                    continue;

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
        return attributeType.toJavaType(attributeValue);
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
