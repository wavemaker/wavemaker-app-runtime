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
package com.wavemaker.runtime.data.dao.util;

import java.util.Collections;
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

import com.wavemaker.runtime.data.transform.Transformers;
import com.wavemaker.runtime.system.SystemPropertiesUnit;
import com.wavemaker.studio.common.CommonConstants;

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
        if (isSystemProperty(namedParameter)) {
            query.setParameter(namedParameter, SystemPropertiesUnit.valueOf(namedParameter).getValue());
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

        if (isSystemProperty(namedParameter)) {
            query.setParameter(namedParameter, SystemPropertiesUnit.valueOf(namedParameter).getValue());
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

    private static boolean isSystemProperty(final String property) {
        if (property.startsWith(CommonConstants.SYSTEM_PARAM_PREFIX)) {
            try {
                SystemPropertiesUnit systemPropertiesUnit = SystemPropertiesUnit.valueOf(property);
                return true;
            } catch (IllegalArgumentException e) {
                //do nothing
            }
        }
        return false;
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
                    Query query = isNative ? session.createSQLQuery(strQuery) : session.createQuery(strQuery);
                    configureParameters(query, params);
                    Object result = query.uniqueResult();
                    long countVal = result == null ? 0 : ((Number) result).longValue();
                    return countVal;
                }
            });
        } catch (Exception ex) {
            LOGGER.error("Count query operation failed", ex);
            return maxCount();
        }
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
}
