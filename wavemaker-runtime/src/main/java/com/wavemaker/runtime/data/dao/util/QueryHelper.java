package com.wavemaker.runtime.data.dao.util;

import java.util.List;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.data.exception.QueryParameterMismatchException;
import com.wavemaker.runtime.data.model.CustomQueryParam;

public class QueryHelper {

    private static final String SELECT_COUNT = "select count(*) ";
    private static final String FROM = " FROM ";
    private static final String FROM_HQL = "FROM ";//For a Select (*) hibernate query.

    private static final Logger LOGGER = LoggerFactory
            .getLogger(QueryHelper.class);

    public static String getCountQuery(String query, Map<String, Object> params)
            throws QueryParameterMismatchException {
        LOGGER.debug("Getting count query for query {} with params {}", query, params);
        if (params != null) {
            for (String key : params.keySet()) {
                String queryParamName = key.toString();
                Object queryParamValue = params.get(key);
                String parameterPlaceholder = new StringBuilder(":").append(
                        queryParamName).toString();
                if (!query.contains(parameterPlaceholder)) {
                    throw new QueryParameterMismatchException("Parameter "
                            + queryParamName
                            + " does not exist in named query.");
                } else {
                    query = StringUtils.replace(query, parameterPlaceholder,
                            String.valueOf(queryParamValue));
                }
            }
        }
        LOGGER.debug("Got query string after placing params {}", query);
        query=query.trim();
        int index = StringUtils.indexOfIgnoreCase(query,FROM_HQL );
        if(index!=0)
        {
            index=StringUtils.indexOfIgnoreCase(query, FROM);

        }
        if(index<0)
            throw new RuntimeException("Malformed query : "+query);
        String subQuery = query.substring(index, query.length());
        String countQuery=SELECT_COUNT + subQuery;
        LOGGER.debug("Got count query string {}", countQuery);
        return countQuery;
    }
}
