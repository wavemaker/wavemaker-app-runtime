/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
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
import java.io.Serializable;
import java.lang.reflect.ParameterizedType;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import javax.annotation.PostConstruct;

import org.apache.commons.lang3.ArrayUtils;
import org.hibernate.Criteria;
import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.Restrictions;
import org.hibernate.query.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateCallback;
import org.springframework.orm.hibernate5.HibernateTemplate;

import com.wavemaker.runtime.data.dao.generators.EntityQueryGenerator;
import com.wavemaker.runtime.data.dao.generators.SimpleEntitiyQueryGenerator;
import com.wavemaker.runtime.data.dao.query.providers.AppRuntimeParameterProvider;
import com.wavemaker.runtime.data.dao.query.providers.ParametersProvider;
import com.wavemaker.runtime.data.dao.query.providers.RuntimeQueryProvider;
import com.wavemaker.runtime.data.dao.query.types.HqlParameterTypeResolver;
import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.dao.validators.SortValidator;
import com.wavemaker.runtime.data.export.DataExporter;
import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.export.QueryExtractor;
import com.wavemaker.runtime.data.export.hqlquery.HqlQueryExtractor;
import com.wavemaker.runtime.data.expression.AttributeType;
import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.data.expression.Type;
import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.model.AggregationInfo;
import com.wavemaker.runtime.data.util.CriteriaUtils;
import com.wavemaker.runtime.data.util.HqlQueryBuilder;
import com.wavemaker.runtime.data.util.HqlQueryHelper;
import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.file.model.Downloadable;

public abstract class WMGenericDaoImpl<Entity extends Serializable, Identifier extends Serializable> implements
        WMGenericDao<Entity, Identifier> {

    protected Class<Entity> entityClass;
    protected EntityQueryGenerator<Entity, Identifier> queryGenerator;

    private SortValidator sortValidator;

    public abstract HibernateTemplate getTemplate();

    @SuppressWarnings("unchecked")
    @PostConstruct
    public void init() {
        if (getTemplate() == null) {
            throw new RuntimeException("hibernate template is not set.");
        }

        ParameterizedType genericSuperclass = (ParameterizedType) getClass().getGenericSuperclass();
        this.entityClass = (Class<Entity>) genericSuperclass.getActualTypeArguments()[0];
        this.sortValidator = new SortValidator();

        queryGenerator = new SimpleEntitiyQueryGenerator<>(entityClass);
    }

    @SuppressWarnings("unchecked")
    public Entity create(Entity entity) {
        Identifier identifier = (Identifier) getTemplate().save(entity);
        getTemplate().flush();
        return entity;
    }

    public void update(Entity entity) {
        getTemplate().update(entity);
        getTemplate().flush();
    }

    public void delete(Entity entity) {
        getTemplate().delete(entity);
    }

    public Entity findById(Identifier entityId) {
        final HqlQueryBuilder builder = queryGenerator.findById(entityId);

        return HqlQueryHelper.execute(getTemplate(), entityClass, builder);
    }

    @SuppressWarnings("unchecked")
    public Entity findByUniqueKey(final Map<String, Object> fieldValueMap) {
        final HqlQueryBuilder builder = queryGenerator.findBy(fieldValueMap);

        return HqlQueryHelper.execute(getTemplate(), entityClass, builder);
    }

    @Override
    public Page<Entity> list(Pageable pageable) {
        return search(null, pageable);
    }

    @SuppressWarnings("unchecked")
    public Page getAssociatedObjects(
            final Object value, final String fieldName, final String key, final Pageable pageable) {
        this.sortValidator.validate(pageable, entityClass);
        return getTemplate().execute(session -> {
            Criteria criteria = session.createCriteria(entityClass).createCriteria(fieldName);
            criteria.add(Restrictions.eq(key, value));
            return CriteriaUtils.executeAndGetPageableData(criteria, pageable, null);
        });
    }

    @SuppressWarnings("unchecked")
    public Page<Entity> search(final QueryFilter queryFilters[], final Pageable pageable) {
        this.sortValidator.validate(pageable, entityClass);
        validateQueryFilters(queryFilters);
        return getTemplate().execute((HibernateCallback<Page>) session -> {
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
        });
    }

    @Override
    @SuppressWarnings("unchecked")
    public Page<Entity> searchByQuery(final String query, final Pageable pageable) {
        this.sortValidator.validate(pageable, entityClass);

        final HqlQueryBuilder builder = queryGenerator.searchByQuery(query);
        return HqlQueryHelper.execute(getTemplate(), entityClass, builder, pageable);
    }

    @Override
    public long count() {
        return count("");
    }

    @Override
    public long count(final String query) {
        return getTemplate().execute(session -> {
            final WMQueryInfo queryInfo = queryGenerator.searchByQuery(query).build();
            return QueryHelper
                    .getQueryResultCount(queryInfo.getQuery(), queryInfo.getParameters(), false, getTemplate());
        });
    }

    @Override
    @SuppressWarnings("unchecked")
    public Page<Map<String, Object>> getAggregatedValues(
            final AggregationInfo aggregationInfo, final Pageable pageable) {
        this.sortValidator.validate(pageable, entityClass);

        final HqlQueryBuilder builder = queryGenerator.getAggregatedValues(aggregationInfo);
        final Page result = HqlQueryHelper.execute(getTemplate(), Map.class, builder, pageable);

        return (Page<Map<String, Object>>) result;
    }

    @Override
    public Downloadable export(final ExportType exportType, final String query, final Pageable pageable) {
        this.sortValidator.validate(pageable, entityClass);
        ByteArrayOutputStream reportOutputStream = getTemplate()
                .execute(session -> {
                    final WMQueryInfo queryInfo = queryGenerator.searchByQuery(query).build();
                    final RuntimeQueryProvider<Entity> queryProvider = RuntimeQueryProvider
                            .from(queryInfo, entityClass);
                    ParametersProvider provider = new AppRuntimeParameterProvider(queryInfo.getParameters(), new
                            HqlParameterTypeResolver());

                    final Query<Entity> hqlQuery = queryProvider.getQuery(session, pageable, provider);
                    QueryExtractor queryExtractor = new HqlQueryExtractor(hqlQuery.scroll());

                    return DataExporter.export(queryExtractor, exportType);
                });
        InputStream is = new ByteArrayInputStream(reportOutputStream.toByteArray());
        return new DownloadResponse(is, exportType.getContentType(),
                entityClass.getSimpleName() + exportType.getExtension());
    }

    @Override
    public Entity refresh(final Entity entity) {
        getTemplate().refresh(entity);
        return entity;
    }

    @Override
    public <T> T execute(final HibernateCallback<T> callback) {
        return getTemplate().execute(callback);
    }

    public Page<Entity> list() {
        return search(null, null);
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
}
