package com.wavemaker.runtime.data.jpa.util;

import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.data.jpa.exception.QueryParameterMismatchException;

public class QueryHelper {

	private static final String SELECT_COUNT = "Select count(*)";
	private static final String FROM = " FROM ";
	
	private static final Logger LOGGER = LoggerFactory
			.getLogger(QueryHelper.class);

	public static String getCountNativeQuery(String query, Map<String, Object>params)
			throws QueryParameterMismatchException {
		LOGGER.debug("Getting count query for query {} with params {}", query, params);
		if (params != null) {
			for (Object key : params.keySet()) {
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
							queryParamValue.toString());
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

}
