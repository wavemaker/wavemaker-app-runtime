package com.wavemaker.runtime.data.model;

import java.util.Map;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class QueryInfo<T> {

    private final String queryName;
    private final Map<String, Object> params;
    private final Class<T> returnClass;

    public QueryInfo(final String queryName, final Map<String, Object> params, final Class<T> returnClass) {
        this.queryName = queryName;
        this.params = params;
        this.returnClass = returnClass;
    }

    public String getQueryName() {
        return queryName;
    }

    public Map<String, Object> getParams() {
        return params;
    }

    public Class<T> getReturnClass() {
        return returnClass;
    }
}
