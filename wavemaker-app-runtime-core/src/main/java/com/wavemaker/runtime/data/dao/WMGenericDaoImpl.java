/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 * <p/>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p/>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p/>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.dao;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Serializable;
import java.lang.reflect.ParameterizedType;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.ArrayUtils;
import org.hibernate.Criteria;
import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.Session;
import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.Restrictions;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate4.HibernateCallback;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.export.DataExporter;
import com.wavemaker.runtime.data.export.ExportOptions;
import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.expression.AttributeType;
import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.data.expression.Type;
import com.wavemaker.runtime.data.util.CriteriaUtils;
import com.wavemaker.runtime.data.util.HQLQueryUtils;
import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.file.model.Downloadable;

public abstract class WMGenericDaoImpl<Entity extends Serializable, Identifier extends Serializable> implements
        WMGenericDao<Entity, Identifier> {

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

    @SuppressWarnings("unchecked")
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

    @SuppressWarnings("unchecked")
    public Entity findByUniqueKey(final Map<String, Object> fieldValueMap) {
        return getTemplate().execute(new HibernateCallback<Entity>() {
            @Override
            public Entity doInHibernate(final Session session) throws HibernateException {
                Criteria criteria = session.createCriteria(entityClass);
                for (final Map.Entry<String, Object> entry : fieldValueMap.entrySet()) {
                    criteria.add(Restrictions.eq(entry.getKey(), entry.getValue()));
                }
                final List list = criteria.list();
                return list.isEmpty() ? null : (Entity) list.get(0);
            }
        });
    }

    @SuppressWarnings("unchecked")
    public Page getAssociatedObjects(
            final Object value, final String fieldName, final String key, final Pageable pageable) {
        return getTemplate().execute(new HibernateCallback<Page>() {
            @Override
            public Page doInHibernate(Session session) throws HibernateException {
                Criteria criteria = session.createCriteria(entityClass).createCriteria(fieldName);
                criteria.add(Restrictions.eq(key, value));
                return CriteriaUtils.executeAndGetPageableData(criteria, pageable, null);
            }
        });
    }

    public Page<Entity> list() {
        return search(null, null);
    }

    @SuppressWarnings("unchecked")
    public Page<Entity> search(final QueryFilter queryFilters[], final Pageable pageable) {
        validateQueryFilters(queryFilters);

        return getTemplate().execute(new HibernateCallback<Page>() {
            @Override
            public Page doInHibernate(Session session) throws HibernateException {
                Criteria criteria = session.createCriteria(entityClass);
                Set<String> aliases = new HashSet<>();
                if (ArrayUtils.isNotEmpty(queryFilters)) {
                    for (QueryFilter queryFilter : queryFilters) {
                        final String attributeName = queryFilter.getAttributeName();

                        // if search filter contains related table property, then add entity alias to criteria to perform search on related properties.
                        CriteriaUtils.criteriaForRelatedProperty(criteria, attributeName, aliases);

                        Criterion criterion = CriteriaUtils.createCriterion(queryFilter);
                        criteria.add(criterion);
                    }
                }
                return CriteriaUtils.executeAndGetPageableData(criteria, pageable, aliases);
            }
        });
    }

    @Override
    @SuppressWarnings("unchecked")
    public Page<Entity> searchByQuery(final String query, final Pageable pageable) {
        return getTemplate().execute(new HibernateCallback<Page<Entity>>() {
            @Override
            public Page<Entity> doInHibernate(Session session) throws HibernateException {
                Query hqlQuery = HQLQueryUtils.createHQLQuery(entityClass.getName(), query, pageable, session);
                return HQLQueryUtils.executeHQLQuery(hqlQuery, Collections.EMPTY_MAP, pageable, getTemplate());
            }
        });
    }

    @Override
    public Downloadable export(final ExportType exportType, final String query, final Pageable pageable) {
        ByteArrayOutputStream reportOutputStream = (ByteArrayOutputStream) getTemplate()
                .execute(new HibernateCallback<OutputStream>() {
                    @Override
                    public OutputStream doInHibernate(Session session) throws HibernateException {
                        ExportOptions exportOptions = new ExportOptions();
                        exportOptions.setPageable(pageable);
                        exportOptions.setQuery(query);
                        DataExporter<Entity> exporter = new DataExporter<>(session, entityClass, exportType,
                                exportOptions);
                        return exporter.build();
                    }
                });
        InputStream is = new ByteArrayInputStream(reportOutputStream.toByteArray());
        return new DownloadResponse(is, exportType.name(), entityClass.getSimpleName() + exportType.getExtension());
    }

    private void validateQueryFilters(QueryFilter[] queryFilters) {
        if (ArrayUtils.isNotEmpty(queryFilters)) {
            for (QueryFilter queryFilter : queryFilters) {
                Object attributeValue = queryFilter.getAttributeValue();
                if (attributeValue == null || queryFilter.getFilterCondition() == Type.NULL) {
                    continue;
                }

                AttributeType attributeType = queryFilter.getAttributeType();
                if (attributeValue instanceof Collection) {
                    Collection collection = (Collection) attributeValue;
                    Object[] objects = collection.toArray(new Object[collection.size()]);
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
                return CriteriaUtils.getRowCount(criteria);
            }
        });
    }

    @Override
    public long count(final String query) {
        return getTemplate().execute(new HibernateCallback<Long>() {
            @Override
            public Long doInHibernate(Session session) throws HibernateException {
                Query hqlQuery = HQLQueryUtils.createHQLQuery(entityClass.getName(), query, null, session);
                return QueryHelper.getQueryResultCount(hqlQuery.getQueryString(), Collections.EMPTY_MAP, false, getTemplate());
            }
        });
    }
}
