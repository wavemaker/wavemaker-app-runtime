/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 * <p/>
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * <p/>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p/>
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */
package com.wavemaker.runtime.data.dao.query;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.hibernate.dialect.Dialect;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate4.HibernateCallback;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.wavemaker.runtime.data.dao.callbacks.NamedQueryCallback;
import com.wavemaker.runtime.data.dao.callbacks.NamedQueryExporterCallback;
import com.wavemaker.runtime.data.dao.callbacks.PaginatedNamedQueryCallback;
import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.CustomQueryParam;
import com.wavemaker.runtime.data.model.PageableQueryInfo;
import com.wavemaker.runtime.data.model.QueryInfo;
import com.wavemaker.runtime.data.model.queries.QueryParameter;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.spring.WMPageImpl;
import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.file.model.Downloadable;
import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.TypeConversionUtils;

public class WMQueryExecutorImpl implements WMQueryExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(WMQueryExecutorImpl.class);

    private static final int DEFAULT_PAGE_NUMBER = 0;
    private static final int DEFAULT_PAGE_SIZE = 20;

    private HibernateTemplate template;

    @Override
    public Page<Object> executeNamedQuery(
            final String queryName, final Map<String, Object> params, final Pageable pageable) {
        return executeNamedQuery(queryName, params, Object.class, pageable);
    }

    @Override
    public <T> T executeNamedQuery(
            final String queryName, final Map<String, Object> params, final Class<T> returnType) {
        NamedQueryCallback<T> callback = new NamedQueryCallback<>(new QueryInfo<>(queryName, params, returnType));
        return template.execute(callback);
    }

    @Override
    public <T> Page<T> executeNamedQuery(
            final String queryName, final Map<String, Object> params, final Class<T> returnType,
            final Pageable pageable) {
        final Pageable _pageable = getValidPageable(pageable);

        PaginatedNamedQueryCallback<T> callback = new PaginatedNamedQueryCallback<>(
                new PageableQueryInfo<>(queryName, params, returnType, _pageable));

        return template.execute(callback);
    }

    @Override
    public int executeNamedQueryForUpdate(final String queryName, final Map<String, Object> params) {

        return template.execute(new HibernateCallback<Integer>() {
            @Override
            public Integer doInHibernate(final Session session) throws HibernateException {
                Query namedQuery = session.getNamedQuery(queryName);
                QueryHelper.configureParameters(session, queryName, namedQuery, params);
                return namedQuery.executeUpdate();
            }
        });

    }

    @Override
    public Page<Object> executeRuntimeQuery(final RuntimeQuery query, final Pageable pageable) {
        final Map<String, Object> prepareParameters = prepareParameters(query);
        Page<Object> result;
        if (query.isNativeSql()) {
            result = executeNativeQuery(query.getQueryString(), prepareParameters, pageable);
        } else {
            result = executeHQLQuery(query.getQueryString(), prepareParameters, pageable);
        }

        return result;
    }

    @Override
    public int executeRuntimeQueryForUpdate(final RuntimeQuery runtimeQuery) {
        return template.execute(new HibernateCallback<Integer>() {
            @Override
            public Integer doInHibernate(final Session session) throws HibernateException {
                return createQuery(runtimeQuery, prepareParameters(runtimeQuery)).executeUpdate();
            }

        });
    }

    protected Page<Object> executeNativeQuery(
            final String queryString, final Map<String, Object> params, final Pageable pageable) {
        final Pageable _pageable = getValidPageable(pageable);
        return template.execute(new HibernateCallback<Page<Object>>() {
            @Override
            public Page<Object> doInHibernate(final Session session) throws HibernateException {
                SQLQuery sqlQuery;
                Long count = QueryHelper.getQueryResultCount(queryString, params, true, template);
                sqlQuery = createNativeQuery(queryString, _pageable.getSort(), params);
                sqlQuery.setFirstResult(_pageable.getOffset());
                sqlQuery.setMaxResults(_pageable.getPageSize());
                return new WMPageImpl(sqlQuery.list(), _pageable, count);

            }
        });
    }

    protected Page<Object> executeHQLQuery(
            final String queryString, final Map<String, Object> params, final Pageable pageable) {
        final Pageable _pageable = getValidPageable(pageable);
        return template.execute(new HibernateCallback<Page<Object>>() {
            public Page<Object> doInHibernate(Session session) throws HibernateException {
                Query hqlQuery = createHQLQuery(queryString, params);
                Long count = QueryHelper.getQueryResultCount(queryString, params, false, template);
                hqlQuery.setFirstResult(_pageable.getOffset());
                hqlQuery.setMaxResults(_pageable.getPageSize());
                return new WMPageImpl(hqlQuery.list(), _pageable, count);

            }
        });
    }

    public HibernateTemplate getTemplate() {
        return template;
    }


    public void setTemplate(HibernateTemplate template) {
        this.template = template;
    }

    public Map<String, Object> prepareParameters(RuntimeQuery query) {
        Map<String, Object> params = new HashMap<>(query.getParameters().size());
        final List<QueryParameter> parameters = query.getParameters();
        if (!parameters.isEmpty()) {
            for (final QueryParameter parameter : parameters) {
                Object convertedValue;
                if (parameter.isList()) {
                    convertedValue = new ArrayList<>();
                    for (final Object object : (List<Object>) parameter.getTestValue()) {
                        ((List<Object>) convertedValue).add(parameter.getType().fromString(String.valueOf(object)));
                    }
                } else {
                    convertedValue = parameter.getType().fromString(String.valueOf(parameter.getTestValue()));
                }
                params.put(parameter.getName(), convertedValue);
            }
        }
        return params;
    }

    @Override
    public Downloadable exportNamedQueryData(
            final String queryName, final Map<String, Object> params, final ExportType exportType,
            final Pageable pageable) {
        final Pageable _pageable = getValidPageable(pageable);
        NamedQueryExporterCallback callback = new NamedQueryExporterCallback(queryName, params, exportType, _pageable);
        ByteArrayOutputStream reportOutStream = template.executeWithNativeSession(callback);
        InputStream is = new ByteArrayInputStream(reportOutStream.toByteArray());
        return new DownloadResponse(is, exportType.getContentType(), queryName + exportType.getExtension());
    }

    @Override
    public Page<Object> executeCustomQuery(CustomQuery customQuery, Pageable pageable) {
        Map<String, Object> params = new HashMap<>();
        prepareParams(params, customQuery);

        if (customQuery.isNativeSql()) {
            return executeNativeQuery(customQuery.getQueryStr(), params, pageable);
        } else {
            return executeHQLQuery(customQuery.getQueryStr(), params, pageable);
        }
    }

    @Override
    public int executeCustomQueryForUpdate(final CustomQuery customQuery) {

        return template.execute(new HibernateCallback<Integer>() {
            @Override
            public Integer doInHibernate(final Session session) throws HibernateException {
                Map<String, Object> params = new HashMap<String, Object>();

                List<CustomQueryParam> customQueryParams = customQuery.getQueryParams();
                if (customQueryParams != null && !customQueryParams.isEmpty())
                    for (CustomQueryParam customQueryParam : customQueryParams) {
                        Object paramValue = validateAndPrepareObject(customQueryParam);
                        params.put(customQueryParam.getParamName(), paramValue);
                    }

                Query query = null;
                if (customQuery.isNativeSql()) {
                    query = createNativeQuery(customQuery.getQueryStr(), params);
                } else {
                    query = createHQLQuery(customQuery.getQueryStr(), params);
                }
                return query.executeUpdate();
            }
        });

    }

    public Query createQuery(RuntimeQuery runtimeQuery, final Map<String, Object> params) {
        final Query query;
        if (runtimeQuery.isNativeSql()) {
            query = createNativeQuery(runtimeQuery.getQueryString(), params);
        } else {
            query = createHQLQuery(runtimeQuery.getQueryString(), params);
        }
        return query;
    }

    private SQLQuery createNativeQuery(String queryString, Map<String, Object> params) {
        Session currentSession = template.getSessionFactory().getCurrentSession();

        SQLQuery sqlQuery = currentSession.createSQLQuery(queryString);
        QueryHelper.setResultTransformer(sqlQuery, Object.class);
        QueryHelper.configureParameters(sqlQuery, params);
        return sqlQuery;
    }

    /**
     * create native order by query from the given queryString & sort criteria...
     */
    private SQLQuery createNativeQuery(String queryString, Sort sort, Map<String, Object> params) {
        String orderedQuery = QueryHelper.arrangeForSort(queryString, sort, true, getDialect());
        return createNativeQuery(orderedQuery, params);
    }

    private Query createHQLQuery(String queryString, Map<String, Object> params) {
        Session currentSession = template.getSessionFactory().getCurrentSession();

        Query hqlQuery = currentSession.createQuery(queryString);
        QueryHelper.setResultTransformer(hqlQuery, Object.class);
        QueryHelper.configureParameters(hqlQuery, params);
        return hqlQuery;
    }

    private void prepareParams(Map<String, Object> params, CustomQuery customQuery) {
        List<CustomQueryParam> customQueryParams = customQuery.getQueryParams();
        if (customQueryParams != null && !customQueryParams.isEmpty()) {
            for (CustomQueryParam customQueryParam : customQueryParams) {
                Object paramValue = customQueryParam.getParamValue();
                if (customQueryParam.isList()) {
                    if (!(paramValue instanceof List)) {
                        throw new WMRuntimeException(customQueryParam.getParamName() + " should have list value ");
                    }
                    params.put(customQueryParam.getParamName(), validateAndPrepareObject(customQueryParam));
                    continue;
                }
                paramValue = validateObject(customQueryParam.getParamType(), customQueryParam.getParamValue());
                params.put(customQueryParam.getParamName(), paramValue);
            }
        }
    }

    private Object validateAndPrepareObject(CustomQueryParam customQueryParam) {
        List<Object> objectList = new ArrayList<Object>();
        if (customQueryParam.getParamValue() instanceof List) {
            List<Object> listParams = (List) customQueryParam.getParamValue();
            for (Object listParam : listParams) {
                objectList.add(validateObject(customQueryParam.getParamType(), listParam));
            }
        } else {
            objectList.add(validateObject(customQueryParam.getParamType(), customQueryParam.getParamValue()));
        }
        return objectList;
    }

    private Object validateObject(String paramType, Object paramValue) {
        try {
            Class loader = Class.forName(paramType);
            paramValue = TypeConversionUtils.fromString(loader, paramValue.toString(), false);
        } catch (IllegalArgumentException ex) {
            LOGGER.error("Failed to Convert param value for query", ex);
            throw new WMRuntimeException(MessageResource.QUERY_CONV_FAILURE, ex);
        } catch (ClassNotFoundException ex) {
            throw new WMRuntimeException(MessageResource.CLASS_NOT_FOUND, ex, paramType);
        }
        return paramValue;
    }

    private Dialect getDialect() {
        return ((SessionFactoryImplementor) template.getSessionFactory()).getDialect();
    }

    private Pageable getValidPageable(final Pageable pageable) {
        return pageable == null ? new PageRequest(DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE) : pageable;
    }
}