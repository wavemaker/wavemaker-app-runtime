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
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import org.apache.commons.lang3.StringUtils;
import org.hibernate.Session;
import org.hibernate.dialect.Dialect;
import org.hibernate.query.NativeQuery;
import org.hibernate.query.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate5.HibernateTemplate;

import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.runtime.data.model.procedures.ProcedureParameter;
import com.wavemaker.runtime.data.model.procedures.ProcedureParameterType;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;
import com.wavemaker.runtime.data.model.queries.QueryParameter;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.transform.Transformers;
import com.wavemaker.runtime.data.transform.WMResultTransformer;

public class QueryHelper {

    private static final Logger LOGGER = LoggerFactory.getLogger(QueryHelper.class);

    private static final String EMPTY_SPACE = " ";
    private static final String ORDER_PROPERTY_SEPARATOR = ",";
    private static final String BACK_TICK = "`";

    private static final String COUNT_QUERY_TEMPLATE = "select count(*) from ({0}) wmTempTable";
    private static final String ORDER_BY_QUERY_TEMPLATE = "select * from ({0}) wmTempTable";

    private static final String SELECT_COUNT1 = "select count(*) ";
    private static final String FROM = " FROM ";
    private static final String FROM_HQL = "FROM ";//For a Select (*) hibernate query.
    private static final String GROUP_BY = " group by ";
    private static final String ORDER_BY = " order by ";

    public static String applySortingForNativeQuery(
            String queryString, Sort sort, WMResultTransformer transformer, Dialect dialect) {
        String withOrderBy = queryString;
        if (sort != null && sort.iterator().hasNext()) {
            withOrderBy = ORDER_BY_QUERY_TEMPLATE.replace("{0}", queryString) +
                    ORDER_BY +
                    buildOrderByClause(sort, ((Function<String, String>) transformer::aliasFromFieldName)
                            .andThen(dialect::quote)
                            .andThen(QueryHelper::quoteWithBackTick));
        }
        return withOrderBy;
    }

    public static String applySortingForHqlQuery(String queryString, Sort sort, WMResultTransformer transformer) {
        String withOrderBy = queryString;

        if (sort != null && sort.iterator().hasNext()) {
            withOrderBy = queryString + ORDER_BY + buildOrderByClause(sort, transformer::aliasFromFieldName);
        }

        return withOrderBy;
    }

    public static String buildOrderByClause(Sort sort, Function<String, String> fieldMapper) {
        StringBuilder orderBy = new StringBuilder();
        final Iterator<Sort.Order> iterator = sort.iterator();
        while (iterator.hasNext()) {
            final Sort.Order order = iterator.next();

            final String property = fieldMapper.apply(order.getProperty());
            Sort.Direction direction = order.getDirection();
            if (direction == null) {
                direction = Sort.Direction.ASC;
            }
            orderBy.append(property)
                    .append(EMPTY_SPACE)
                    .append(direction.name());
            if (iterator.hasNext()) {
                orderBy.append(ORDER_PROPERTY_SEPARATOR);
            }
        }
        return orderBy.toString();
    }

    private static String quoteWithBackTick(final String str) {
        if (!StringUtils.isNotBlank(str)) {
            return str;
        }

        if (str.charAt(0) != '`') {
            return BACK_TICK + str + BACK_TICK;
        }

        return str;
    }

    public static void setResultTransformer(Query query, Class<?> type) {
//        TODO replace deprecated methods
        if (query instanceof NativeQuery || (query.getReturnAliases() != null && query
                .getReturnAliases().length != 0)) {
            query.setResultTransformer(Transformers.aliasToMappedClass(type));
        }
    }

    public static Query createQuery(final Session session, final boolean isNative, final String query) {
        return (isNative) ? session.createNativeQuery(query) : session.createQuery(query);
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

            return template.execute(session -> executeCountQuery(session, isNative, strQuery, params));
        } catch (Exception ex) {
            LOGGER.error("Count query operation failed", ex);
            return maxCount();
        }
    }

    public static Long executeCountQuery(
            final Session session, final boolean isNative, final String strQuery, final Map<String, Object> params) {
        Query<Integer> query = isNative ? session.createNativeQuery(strQuery) : session.createQuery(strQuery);
        ParametersConfigurator.configure(query, params);
        Object result = query.uniqueResult();
        return result == null ? 0 : ((Number) result).longValue();
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

    public static Object prepareParam(final QueryParameter parameter, final boolean isNative) {
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
        Object convertedValue = value;
        if (value != null && javaType != JavaType.BLOB) {
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

    public static NativeQuery createNativeQuery(String queryString, Map<String, Object> params, final Session session) {
        NativeQuery sqlQuery = session.createNativeQuery(queryString);
        QueryHelper.setResultTransformer(sqlQuery, Map.class);
        ParametersConfigurator.configure(sqlQuery, params);
        return sqlQuery;
    }

    public static Query createHQLQuery(String queryString, Map<String, Object> params, final Session session) {
        Query hqlQuery = session.createQuery(queryString);
        QueryHelper.setResultTransformer(hqlQuery, Map.class);
        ParametersConfigurator.configure(hqlQuery, params);
        return hqlQuery;
    }
}
