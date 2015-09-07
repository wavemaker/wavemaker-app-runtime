package com.wavemaker.runtime.data.dao.util;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.transform.Transformers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.hibernate4.HibernateTemplate;

public class QueryHelper {

    private static final String SELECT_COUNT = "select count(*) from (";
    private static final String ALIAS=" ) wmTempTable";
    private static final String FROM = " FROM ";
    private static final String FROM_HQL = "FROM ";//For a Select (*) hibernate query.
    private static final String SELECT_COUNT1 = "select count(*) ";
    private static final String GROUP_BY = " group by ";

    private static final Logger LOGGER = LoggerFactory
            .getLogger(QueryHelper.class);

    public static void configureParameters(Query query, Map<String, Object> params) {
        String[] namedParameters = query.getNamedParameters();
        if(namedParameters != null && namedParameters.length > 0) {
            if(params == null || params.isEmpty())
                throw new RuntimeException("Require input parameters such as: " + Arrays.asList(namedParameters));

            for (String namedParameter : namedParameters) {
                Object val = params.get(namedParameter);
                if(val != null && val instanceof List)
                    query.setParameterList(namedParameter, (List)val);
                else
                    query.setParameter(namedParameter, val);

            }
        }
    }


    public static void setResultTransformer(Query query) {
        if(query instanceof SQLQuery)
        {
            query.setResultTransformer(Transformers.ALIAS_TO_ENTITY_MAP);
            return;
        }
        else
        {
            String[] returnAliases = query.getReturnAliases();
            if(returnAliases != null) {
               LOGGER.debug("return aliases : {}" , Arrays.asList(returnAliases));
             } else {
               LOGGER.debug("return aliases is null" );
           }
        if(returnAliases != null)
            query.setResultTransformer(Transformers.ALIAS_TO_ENTITY_MAP);
        }
    }


    public static Long getQueryResultCount(String queryStr, Map<String, Object> params, boolean isNative, HibernateTemplate template)
    {

        return getCountFromCountStringQuery(queryStr, params, isNative, template);

    }

    private static Long getCountFromCountStringQuery(String queryStr, Map<String, Object> params, boolean isNative, HibernateTemplate template) {
        try{
        String strQuery = getCountQuery(queryStr, params, isNative);
         if(strQuery == null){
            return -1L;
         }
        Query query=null;
        if(isNative)
            query = template.getSessionFactory().getCurrentSession().createSQLQuery(strQuery);
        else
            query=template.getSessionFactory().getCurrentSession().createQuery(strQuery);
        configureParameters(query, params);
        Object result = query.uniqueResult();
        long countVal = result == null ? 0 : ((Number)result).longValue();
        return countVal;
        }
        catch(Exception ex)
        {
            LOGGER.error("Count query operation failed", ex);
            return -1L;
        }
    }
    private static String getCountQuery(String query, Map<String, Object> params, boolean isNative) {
        LOGGER.debug("Getting count query for query {} with params {}", query, params);

        query = query.trim();
        if (isNative) {
            String countQuery = SELECT_COUNT + query + ALIAS;
            LOGGER.debug("Got count query string {}", countQuery);
            return countQuery;

        } else {
            int index = StringUtils.indexOfIgnoreCase(query, GROUP_BY);
            if(index>=0)
            {
                return null;
            }
            index = StringUtils.indexOfIgnoreCase(query, FROM_HQL);
            if (index != 0) {
                index = StringUtils.indexOfIgnoreCase(query, FROM);

            }
            if (index < 0)
                throw new RuntimeException("Malformed query : " + query);
            String subQuery = query.substring(index, query.length());
            return SELECT_COUNT1+subQuery;
        }

    }
}
