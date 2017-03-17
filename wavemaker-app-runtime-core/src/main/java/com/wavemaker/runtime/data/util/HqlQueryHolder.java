package com.wavemaker.runtime.data.util;

import java.util.Map;

import org.hibernate.Query;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/3/17
 */
public class HqlQueryHolder {

    private final Query query;
    private final Map<String, Object> parameters;

    public HqlQueryHolder(final Query query, final Map<String, Object> parameters) {
        this.query = query;
        this.parameters = parameters;
    }

    public Query getQuery() {
        return query;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }
}
