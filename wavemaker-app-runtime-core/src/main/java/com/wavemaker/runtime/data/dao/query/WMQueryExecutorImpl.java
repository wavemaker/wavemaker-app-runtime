/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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
package com.wavemaker.runtime.data.dao.query;

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
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate4.HibernateCallback;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.CustomQueryParam;
import com.wavemaker.runtime.data.spring.WMPageImpl;
import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.TypeConversionUtils;

public class WMQueryExecutorImpl implements WMQueryExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(WMQueryExecutorImpl.class);

    private HibernateTemplate template;

    @Override
    public Page<Object> executeNamedQuery(final String queryName, final Map<String, Object> params, final Pageable pageable) {
        return template.execute(new HibernateCallback<Page<Object>>() {
            @Override
            public Page<Object> doInHibernate(Session session) throws HibernateException {
                Query namedQuery = session.getNamedQuery(queryName);
                QueryHelper.setResultTransformer(namedQuery);
                QueryHelper.configureParameters(namedQuery, params);

                if (pageable != null) {
                    Query copyOfNamedQuery = namedQuery;
                    final boolean isNative = namedQuery instanceof SQLQuery;
                    if (isNative) { //adding order by from pagination to query.
                        namedQuery = createNativeQuery(namedQuery.getQueryString(), pageable.getSort(), params);
                    }
                    namedQuery.setFirstResult(pageable.getOffset());
                    namedQuery.setMaxResults(pageable.getPageSize());
                    Long count = QueryHelper.getQueryResultCount(copyOfNamedQuery.getQueryString(), params, isNative, template);
                    return new WMPageImpl(namedQuery.list(), pageable, count);
                }
                return new WMPageImpl(namedQuery.list());
            }
        });
    }

    @Override
    public Page<Object> executeCustomQuery(CustomQuery customQuery, Pageable pageable) {
        Map<String, Object> params = new HashMap<String, Object>();
        prepareParams(params, customQuery);

        if (customQuery.isNativeSql()) {
            return executeNativeQuery(customQuery.getQueryStr(), params, pageable);
        } else {
            return executeHQLQuery(customQuery.getQueryStr(), params, pageable);
        }
    }

    @Override
    public int executeNamedQueryForUpdate(final String queryName, final Map<String, Object> params) {

        return template.execute(new HibernateCallback<Integer>() {
            @Override
            public Integer doInHibernate(final Session session) throws HibernateException {
                Query namedQuery = session.getNamedQuery(queryName);
                QueryHelper.setResultTransformer(namedQuery);
                QueryHelper.configureParameters(session, queryName, namedQuery, params);
                return namedQuery.executeUpdate();
            }
        });

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

    protected Page<Object> executeNativeQuery(final String queryString, final Map<String, Object> params, final Pageable pageable) {

        return template.execute(new HibernateCallback<Page<Object>>() {
            @Override
            public Page<Object> doInHibernate(final Session session) throws HibernateException {
                SQLQuery sqlQuery;
                if (pageable != null) {
                    Long count = QueryHelper.getQueryResultCount(queryString, params, true, template);
                    sqlQuery = createNativeQuery(queryString, pageable.getSort(), params);
                    sqlQuery.setFirstResult(pageable.getOffset());
                    sqlQuery.setMaxResults(pageable.getPageSize());
                    return new WMPageImpl(sqlQuery.list(), pageable, count);
                }
                sqlQuery = createNativeQuery(queryString, params);
                return new WMPageImpl(sqlQuery.list());
            }
        });
    }

    protected Page<Object> executeHQLQuery(final String queryString, final Map<String, Object> params, final Pageable pageable) {

        return template.execute(new HibernateCallback<Page<Object>>() {
            public Page<Object> doInHibernate(Session session) throws HibernateException {
                Query hqlQuery = createHQLQuery(queryString, params);

                if (pageable != null) {
                    Long count = QueryHelper.getQueryResultCount(queryString, params, false, template);
                    hqlQuery.setFirstResult(pageable.getOffset());
                    hqlQuery.setMaxResults(pageable.getPageSize());
                    return new WMPageImpl(hqlQuery.list(), pageable, count);
                }
                return new WMPageImpl(hqlQuery.list());
            }
        });
    }

    public HibernateTemplate getTemplate() {
        return template;
    }


    public void setTemplate(HibernateTemplate template) {
        this.template = template;
    }

    private SQLQuery createNativeQuery(String queryString, Map<String, Object> params) {
        Session currentSession = template.getSessionFactory().getCurrentSession();

        SQLQuery sqlQuery = currentSession.createSQLQuery(queryString);
        QueryHelper.setResultTransformer(sqlQuery);
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
        QueryHelper.setResultTransformer(hqlQuery);
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
            return objectList;
        }
        objectList.add(validateObject(customQueryParam.getParamType(), customQueryParam.getParamValue()));
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
}