package com.wavemaker.runtime.data.jpa.util;

import java.util.List;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.data.jpa.exception.QueryParameterMismatchException;
import com.wavemaker.runtime.data.model.CustomQueryParam;

public class QueryHelper {

    private static final String SELECT_COUNT = "Select count(*)";
    private static final String FROM = " FROM ";

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
        int index = StringUtils.indexOfIgnoreCase(query, FROM);
        String subQuery = query.substring(index, query.length());
        String countQuery=SELECT_COUNT + subQuery;
        LOGGER.debug("Got count query string {}", countQuery);
        return countQuery;
    }

	public static String getCountCustomQuery(String queryStr,
			List<CustomQueryParam> queryParamsList) {
		LOGGER.debug("Getting count query for query {} with params {}", queryStr, queryParamsList);
        if (queryParamsList != null) {
        	for (CustomQueryParam param : queryParamsList) {
                String queryParamName = param.getParamName();
                Object queryParamValue = param.getParamValue();
                String parameterPlaceholder = new StringBuilder(":").append(
                        queryParamName).toString();
                if (!queryStr.contains(parameterPlaceholder)) {
                    throw new QueryParameterMismatchException("Parameter "
                            + queryParamName
                            + " does not exist in named query.");
                } else {
                	queryStr = StringUtils.replace(queryStr, parameterPlaceholder,
                            String.valueOf(queryParamValue));
                }
            }
        }
        LOGGER.debug("Got query string after placing params {}", queryStr);
        int index = StringUtils.indexOfIgnoreCase(queryStr, FROM);
        String subQuery = queryStr.substring(index, queryStr.length());
        String countQuery=SELECT_COUNT + subQuery;
        LOGGER.debug("Got count query string {}", countQuery);
        return countQuery;
	}

}
