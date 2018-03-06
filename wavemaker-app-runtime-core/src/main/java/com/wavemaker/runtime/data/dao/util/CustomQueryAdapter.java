package com.wavemaker.runtime.data.dao.util;

import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.CustomQueryParam;
import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.runtime.data.model.queries.QueryParameter;
import com.wavemaker.runtime.data.model.queries.QueryType;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.util.JavaTypeUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 4/8/17
 */
public class CustomQueryAdapter {

    private CustomQueryAdapter(){}

    private static Pattern QUERY_TYPE_PATTERN = Pattern.compile("^([^\\s]+)");

    public static RuntimeQuery adapt(CustomQuery query) {
        final List<QueryParameter> parameters = query.getQueryParams().stream()
                .map(CustomQueryAdapter::adapt)
                .collect(Collectors.toList());

        return new RuntimeQuery(query.getQueryStr(), query.isNativeSql(), findQueryType(query), parameters);
    }

    public static QueryParameter adapt(CustomQueryParam param) {
        final Optional<JavaType> javaType = JavaTypeUtils.fromClassName(param.getParamType());
        return new QueryParameter(param.getParamName(), javaType.orElseThrow(() ->
                new IllegalArgumentException(
                        "Unknown parameter type found:" + param.getParamType() + ", for parameter:" + param
                                .getParamName())),
                param.isList(), param.getParamValue());
    }

    private static QueryType findQueryType(CustomQuery query) {
        final String sqlScript = query.getQueryStr();
        QueryType queryType = QueryType.UPDATE;
        Matcher matcher = QUERY_TYPE_PATTERN.matcher(sqlScript);
        if (matcher.find()) {
            String prefix = matcher.group(1);
            try {
                if (prefix.equalsIgnoreCase("from")) {
                    queryType = QueryType.SELECT;
                } else {
                    queryType = QueryType.valueOf(prefix.toUpperCase());
                }
            } catch (IllegalArgumentException e) {
                // ignore
            }
        }
        return queryType;
    }
}
