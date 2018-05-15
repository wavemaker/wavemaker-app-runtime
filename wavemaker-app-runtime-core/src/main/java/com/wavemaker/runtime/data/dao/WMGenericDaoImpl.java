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
import java.io.OutputStream;
import java.io.Serializable;
import java.lang.reflect.ParameterizedType;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.ArrayUtils;
import org.hibernate.Criteria;
import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.Restrictions;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateCallback;
import org.springframework.orm.hibernate5.HibernateTemplate;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.dao.generators.EntityQueryGenerator;
import com.wavemaker.runtime.data.dao.generators.SimpleEntitiyQueryGenerator;
import com.wavemaker.runtime.data.dao.query.providers.AppRuntimeParameterProvider;
import com.wavemaker.runtime.data.dao.query.providers.ParametersProvider;
import com.wavemaker.runtime.data.dao.query.providers.RuntimeQueryProvider;
import com.wavemaker.runtime.data.dao.query.types.HqlParameterTypeResolver;
import com.wavemaker.runtime.data.dao.util.PageUtils;
import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.dao.validators.SortValidator;
import com.wavemaker.runtime.data.exception.EntityNotFoundException;
import com.wavemaker.runtime.data.export.DataExporter;
import com.wavemaker.runtime.data.export.ExportOptions;
import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.export.QueryExtractor;
import com.wavemaker.runtime.data.export.hqlquery.HqlQueryExtractor;
import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.hql.SelectQueryBuilder;
import com.wavemaker.runtime.data.model.AggregationInfo;
import com.wavemaker.runtime.data.util.CriteriaUtils;
import com.wavemaker.runtime.data.util.DaoUtils;
import com.wavemaker.runtime.data.util.HqlQueryHelper;
import com.wavemaker.runtime.file.manager.ExportedFileManager;
import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.file.model.Downloadable;

public abstract class WMGenericDaoImpl<E extends Serializable, I extends Serializable> implements
        WMGenericDao<E, I> {

    protected Class<E> entityClass;
    protected EntityQueryGenerator<E, I> queryGenerator;

    protected SortValidator sortValidator;

    @Autowired
    private ExportedFileManager exportedFileManager;

    public abstract HibernateTemplate getTemplate();

    @SuppressWarnings("unchecked")
    @PostConstruct
    public void init() {
        if (getTemplate() == null) {
            throw new WMRuntimeException("hibernate template is not set.");
        }

        ParameterizedType genericSuperclass = (ParameterizedType) getClass().getGenericSuperclass();
        this.entityClass = (Class<E>) genericSuperclass.getActualTypeArguments()[0];
        this.sortValidator = new SortValidator();

        queryGenerator = new SimpleEntitiyQueryGenerator<>(entityClass);
    }

    @SuppressWarnings("unchecked")
    public E create(E entity) {
        getTemplate().save(entity);
        getTemplate().flush();
        return entity;
    }

    public void update(E entity) {
        getTemplate().update(entity);
        getTemplate().flush();
    }

    public void delete(E entity) {
        getTemplate().delete(entity);
    }

    public E findById(I entityId) {
        final SelectQueryBuilder builder = queryGenerator.findById(entityId);

        return HqlQueryHelper.execute(getTemplate(), entityClass, builder)
                .orElseThrow(() -> new EntityNotFoundException("No entity exists for given id:" + entityId));
    }

    @Override
    public List<E> findByMultipleIds(final List<I> ids, final boolean orderedReturn) {
        return getTemplate().execute(session -> session.byMultipleIds(entityClass)
                .enableOrderedReturn(orderedReturn)
                .multiLoad(ids));
    }

    @SuppressWarnings("unchecked")
    public E findByUniqueKey(final Map<String, Object> fieldValueMap) {
        final SelectQueryBuilder builder = queryGenerator.findBy(fieldValueMap);

        return HqlQueryHelper.execute(getTemplate(), entityClass, builder)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No entity found for given unique key values:" + fieldValueMap));
    }

    @Override
    public Page<E> list(Pageable pageable) {
        return search(null, PageUtils.defaultIfNull(pageable));
    }

    @SuppressWarnings("unchecked")
    public Page getAssociatedObjects(
            final Object value, final String fieldName, final String key, final Pageable pageable) {
        Pageable validPageable = PageUtils.defaultIfNull(pageable);
        this.sortValidator.validate(validPageable, entityClass);
        return getTemplate().execute(session -> {
            Criteria criteria = session.createCriteria(entityClass).createCriteria(fieldName);
            criteria.add(Restrictions.eq(key, value));
            return CriteriaUtils.executeAndGetPageableData(criteria, validPageable, null);
        });
    }

    @SuppressWarnings("unchecked")
    public Page<E> search(final QueryFilter[] queryFilters, final Pageable pageable) {
        Pageable validPageable = PageUtils.defaultIfNull(pageable);
        this.sortValidator.validate(validPageable, entityClass);
        DaoUtils.validateQueryFilters(queryFilters);
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
            return CriteriaUtils.executeAndGetPageableData(criteria, validPageable, aliases);
        });
    }

    @Override
    @SuppressWarnings("unchecked")
    public Page<E> searchByQuery(final String query, final Pageable pageable) {
        Pageable validPageable = PageUtils.defaultIfNull(pageable);

        this.sortValidator.validate(validPageable, entityClass);

        final SelectQueryBuilder builder = queryGenerator.searchByQuery(query);
        return HqlQueryHelper.execute(getTemplate(), entityClass, builder, validPageable);
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
        Pageable validPageable = PageUtils.defaultIfNull(pageable);

        this.sortValidator.validate(validPageable, entityClass);

        final SelectQueryBuilder builder = queryGenerator.getAggregatedValues(aggregationInfo);
        final Page result = HqlQueryHelper.execute(getTemplate(), Map.class, builder, validPageable);

        return (Page<Map<String, Object>>) result;
    }

    @Override
    public Downloadable export(final ExportType exportType, final String query, final Pageable pageable) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        export(new ExportOptions(exportType, query), pageable, outputStream);
        return new DownloadResponse(new ByteArrayInputStream(outputStream.toByteArray()), exportType.getContentType(),
                entityClass.getSimpleName() + exportType.getExtension());
    }

    @Override
    public void export(ExportOptions options, Pageable pageable, OutputStream outputStream) {
        Pageable validPageable = PageUtils.defaultIfNull(pageable);
        this.sortValidator.validate(validPageable, entityClass);
        getTemplate().execute(session -> {
            final WMQueryInfo queryInfo = queryGenerator.searchByQuery(options.getQuery()).build();
            final RuntimeQueryProvider<E> queryProvider = RuntimeQueryProvider
                    .from(queryInfo, entityClass);
            ParametersProvider provider = new AppRuntimeParameterProvider(queryInfo.getParameters(), new
                    HqlParameterTypeResolver());

            final Query<E> hqlQuery = queryProvider.getQuery(session, validPageable, provider);
            QueryExtractor queryExtractor = new HqlQueryExtractor(hqlQuery.scroll());
            DataExporter.export(queryExtractor, options, entityClass, outputStream);
            return null;
        });
    }

    @Override
    public E refresh(final E entity) {
        getTemplate().refresh(entity);
        return entity;
    }

    @Override
    public void evict(final E entity) {
        getTemplate().evict(entity);
    }

    @Override
    public <T> T execute(final HibernateCallback<T> callback) {
        return getTemplate().execute(callback);
    }
}
