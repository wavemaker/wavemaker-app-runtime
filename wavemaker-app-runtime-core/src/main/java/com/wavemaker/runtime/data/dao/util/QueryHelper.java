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
package com.wavemaker.runtime.data.dao.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.hibernate.dialect.Dialect;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.type.BasicType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate4.HibernateCallback;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.runtime.data.model.procedures.ProcedureParameter;
import com.wavemaker.runtime.data.model.procedures.ProcedureParameterType;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;
import com.wavemaker.runtime.data.model.queries.QueryParameter;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.replacers.providers.VariableType;
import com.wavemaker.runtime.data.transform.Transformers;
import com.wavemaker.runtime.data.transform.WMResultTransformer;
import com.wavemaker.runtime.data.util.HQLQueryUtils;

public class QueryHelper {

    public static final String EMPTY_SPACE = " ";
    public static final String ORDER_PROPERTY_SEPARATOR = ",";
    public static final String BACK_TICK = "`";
    private static final Logger LOGGER = LoggerFactory.getLogger(QueryHelper.class);
    private static final String COUNT_QUERY_TEMPLATE = "select count(*) from ({0}) wmTempTable";
    private static final String ORDER_BY_QUERY_TEMPLATE = "select * from ({0}) wmTempTable";
    private static final String SELECT_COUNT1 = "select count(*) ";
    private static final String FROM = " FROM ";
    private static final String FROM_HQL = "FROM ";//For a Select (*) hibernate query.
    private static final String GROUP_BY = " group by ";
    private static final String ORDER_BY = " order by ";

    public static void configureParameters(Query query, Map<String, Object> params) {
        String[] namedParameters = query.getNamedParameters();
        if (namedParameters != null && namedParameters.length > 0) {
            for (String namedParameter : namedParameters) {
                configureNamedParameter(query, params, namedParameter);
            }
        }
    }

    public static void configureParameters(
            final Session session, final String queryName, final Query query, final Map<String, Object> params) {
        String[] namedParameters = query.getNamedParameters();
        if (namedParameters != null && namedParameters.length > 0) {
            for (String namedParameter : namedParameters) {
                configureNamedParameter(session, queryName, query, params, namedParameter);
            }
        }

    }

    private static void configureNamedParameter(Query query, Map<String, Object> params, String namedParameter) {
        final VariableType variableType = VariableType.fromQueryParameter(namedParameter);
        if (variableType.isSystemVariable()) {
            // XXX meta data needed
            query.setParameter(namedParameter, variableType.getValue(null));
        } else {
            Object val = params.get(namedParameter);
            if (val != null && val instanceof List) {
                query.setParameterList(namedParameter, (List) val);
            } else {
                query.setParameter(namedParameter, val);
            }
        }
    }

    private static void configureNamedParameter(
            Session session, String queryName, Query query, Map<String, Object> params,
            String namedParameter) {

        final VariableType variableType = VariableType.fromQueryParameter(namedParameter);
        if (variableType.isSystemVariable()) {
            // XXX meta data needed
            query.setParameter(namedParameter, variableType.getValue(null));
        } else {
            Object val = params.get(namedParameter);
            if (val != null && val instanceof List) {
                query.setParameterList(namedParameter, (List) val);
            } else {
                if (val == null) {
                    Map paramTypes = Collections.emptyMap();
                    if (session.getSessionFactory() instanceof SessionFactoryImplementor) {
                        final SessionFactoryImplementor factory = (SessionFactoryImplementor) session
                                .getSessionFactory();
                        if (factory.getNamedQuery(queryName) != null) {
                            paramTypes = factory.getNamedQuery(queryName).getParameterTypes();
                        } else {
                            paramTypes = factory.getNamedSQLQuery(queryName).getParameterTypes();
                        }
                    }
                    if (paramTypes.containsKey(namedParameter)) {
                        final BasicType type = session.getTypeHelper().basic((String) paramTypes.get(namedParameter));
                        if (type != null) {
                            query.setParameter(namedParameter, val, type);
                        } else {
                            query.setParameter(namedParameter, val);
                        }
                    } else {
                        query.setParameter(namedParameter, val);
                    }
                } else {
                    query.setParameter(namedParameter, val);
                }
            }
        }
    }

    public static String arrangeForSort(String queryStr, Sort sort, boolean isNative, Dialect dialect) {
        if (isNative && sort != null) {
            final Iterator<Sort.Order> iterator = sort.iterator();
            StringBuffer queryWithOrderBy = new StringBuffer(ORDER_BY_QUERY_TEMPLATE.replace("{0}", queryStr));
            int count = 0;
            while (iterator.hasNext()) {
                Sort.Order order = iterator.next();
                if (StringUtils.isNotBlank(order.getProperty())) {
                    String direction = (order.getDirection() == null) ? Sort.Direction.ASC.name() : order.getDirection()
                            .name();
                    queryWithOrderBy.append(count == 0 ? ORDER_BY : ORDER_PROPERTY_SEPARATOR);
                    final String quotedParam = dialect.quote(quoteWithBackTick(order.getProperty()));
                    queryWithOrderBy.append(quotedParam + EMPTY_SPACE + direction);
                    count++;
                }
            }
            return queryWithOrderBy.toString();
        }
        return queryStr;
    }

    public static String quoteWithBackTick(final String str) {
        if (!StringUtils.isNotBlank(str)) {
            return str;
        }

        if (str.charAt(0) != '`') {
            return new StringBuilder().append(BACK_TICK).append(str).append(BACK_TICK).toString();
        }

        return str;
    }

    public static void setResultTransformer(Query query, Class<?> type) {
        if (query instanceof SQLQuery || (query.getReturnAliases() != null && query.getReturnAliases().length != 0)) {
            query.setResultTransformer(Transformers.aliasToMappedClass(type));
        }
    }

    public static Long getQueryResultCount(
            String queryStr, Map<String, Object> params, boolean isNative, HibernateTemplate template) {
        return getCountFromCountStringQuery(queryStr, params, isNative, template);
    }

    private static Long getCountFromCountStringQuery(
            String queryStr, final Map<String, Object> params, final boolean isNative,
            final HibernateTemplate template) {
        try {
            final String strQuery = getCountQuery(queryStr, isNative);
            if (strQuery == null) {
                return maxCount();
            }

            return template.execute(new HibernateCallback<Long>() {
                @Override
                public Long doInHibernate(Session session) throws HibernateException {
                    return executeCountQuery(session, isNative, strQuery, params);
                }
            });
        } catch (Exception ex) {
            LOGGER.error("Count query operation failed", ex);
            return maxCount();
        }
    }

    public static Long executeCountQuery(
            final Session session, final boolean isNative, final String strQuery, final Map<String, Object> params) {
        Query query = isNative ? session.createSQLQuery(strQuery) : session.createQuery(strQuery);
        configureParameters(query, params);
        Object result = query.uniqueResult();
        long countVal = result == null ? 0 : ((Number) result).longValue();
        return countVal;
    }

    public static String getCountQuery(String query, boolean isNative) {
        query = query.trim();

        String countQuery = null;
        if (isNative) {
            countQuery = COUNT_QUERY_TEMPLATE.replace("{0}", query);
            LOGGER.debug("Got count query string {}", countQuery);
        } else {
            int index = StringUtils.indexOfIgnoreCase(query, GROUP_BY);
            if (index == -1) { //we generate count query if there is no group by in it..
                index = StringUtils.indexOfIgnoreCase(query, FROM_HQL);
                if (index >= 0) {
                    if (index != 0) {
                        index = StringUtils.indexOfIgnoreCase(query, FROM);
                        if (index > 0) {
                            query = query.substring(index, query.length());
                        }
                    }
                    index = StringUtils.indexOfIgnoreCase(query, ORDER_BY);
                    if (index >= 0) {
                        query = query.substring(0, index);
                    }
                    countQuery = SELECT_COUNT1 + query;
                }
            }
        }
        return countQuery;
    }

    private static long maxCount() {
        return (long) Integer.MAX_VALUE;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> prepareQueryParameters(RuntimeQuery query) {
        final List<QueryParameter> parameters = query.getParameters();
        Map<String, Object> params = new HashMap<>(parameters.size());
        for (final QueryParameter parameter : parameters) {
            params.put(parameter.getName(), prepareParam(parameter, query.isNativeSql()));
        }
        return params;
    }

    public static List<ProcedureParameter> prepareProcedureParameters(RuntimeProcedure procedure) {
        final List<ProcedureParameter> parameters = procedure.getParameters();
        for (final ProcedureParameter parameter : parameters) {
            final ProcedureParameterType parameterType = parameter.getParameterType();
            if (parameterType.isInParam()) {
                parameter.setTestValue(prepareParam(parameter, true));
            }
        }
        return parameters;
    }

    private static Object prepareParam(final QueryParameter parameter, final boolean isNative) {
        Object convertedValue;
        if (parameter.isList()) {
            convertedValue = new ArrayList<>();
            for (final Object object : (List<Object>) parameter.getTestValue()) {
                ((List<Object>) convertedValue).add(convertValue(parameter, object, isNative));
            }
        } else {
            convertedValue = convertValue(parameter, parameter.getTestValue(), isNative);
        }
        return convertedValue;
    }

    public static Object convertValue(QueryParameter parameter, Object value, boolean isNative) {
        final JavaType javaType = parameter.getType();
        Object convertedValue = null;
        if (value != null) {
            final String fromValue = String.valueOf(value);
            if (StringUtils.isNotBlank(fromValue) || parameter.getType() == JavaType.STRING) {
                convertedValue = javaType.fromString(fromValue);
                if (isNative) {
                    convertedValue = javaType.toDbValue(convertedValue);
                }
            }
        }
        return convertedValue;
    }

    public static Query createQuery(
            RuntimeQuery runtimeQuery, final Map<String, Object> params, final Session session) {
        final Query query;
        if (runtimeQuery.isNativeSql()) {
            query = createNativeQuery(runtimeQuery.getQueryString(), params, session);
        } else {
            query = createHQLQuery(runtimeQuery.getQueryString(), params, session);
        }
        return query;
    }

    public static SQLQuery createNativeQuery(String queryString, Map<String, Object> params, final Session session) {
        SQLQuery sqlQuery = session.createSQLQuery(queryString);
        QueryHelper.setResultTransformer(sqlQuery, Object.class);
        QueryHelper.configureParameters(sqlQuery, params);
        return sqlQuery;
    }

    public static Query createHQLQuery(String queryString, Map<String, Object> params, final Session session) {
        Query hqlQuery = session.createQuery(queryString);
        QueryHelper.setResultTransformer(hqlQuery, Object.class);
        QueryHelper.configureParameters(hqlQuery, params);
        return hqlQuery;
    }

    public static Query createNewNativeQueryWithSorted(
            Session session, SQLQuery query, Class<?> responseType, Sort sort) {
        SQLQuery newQuery = query;
        if (sort != null) {
            final String arrangeForSortQuery = QueryHelper
                    .arrangeForSort(query.getQueryString(), convertToNativeSort(responseType, sort), true,
                            ((SessionFactoryImplementor) session.getSessionFactory()).getDialect());
            newQuery = session.createSQLQuery(arrangeForSortQuery);
        }

        return newQuery;
    }

    public static Query createNewHqlQueryWithSorted(Session session, Query query, Class<?> responseType, Sort sort) {
        Query newQuery = query;
        if (sort != null) {
            final Sort actualSort = convertToNativeSort(responseType, sort);
            final String arrangeForSortQuery = query.getQueryString().concat(" ").concat(HQLQueryUtils
                    .buildOrderByClause(actualSort));
            newQuery = session.createQuery(arrangeForSortQuery);
        }
        return newQuery;
    }

    private static Sort convertToNativeSort(Class<?> responseType, Sort actualSort) {
        final WMResultTransformer transformer = Transformers.aliasToMappedClass(responseType);
        List<Sort.Order> nativeOrders = new ArrayList<>();
        for (final Sort.Order order : actualSort) {
            String property = order.getProperty();
            final String columnName = transformer.aliasFromFieldName(property);
            nativeOrders.add(new Sort.Order(order.getDirection(), columnName, order.getNullHandling()));
        }

        return new Sort(nativeOrders);
    }
}
