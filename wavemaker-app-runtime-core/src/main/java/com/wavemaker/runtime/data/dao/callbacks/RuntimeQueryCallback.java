package com.wavemaker.runtime.data.dao.callbacks;

import java.util.Map;

import org.hibernate.Session;
import org.hibernate.query.Query;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/3/17
 */
public class RuntimeQueryCallback extends AbstractQueryCallback<Map<String, Object>> {

    private String query;
    private Map<String, Object> parameters;
    private boolean isNative;

    public RuntimeQueryCallback(final String query, final Map<String, Object> parameters) {
        this.query = query;
        this.parameters = parameters;
    }

    public RuntimeQueryCallback(final String query, final Map<String, Object> parameters, final boolean isNative) {
        this.query = query;
        this.parameters = parameters;
        this.isNative = isNative;
    }

    @Override
    protected Query getQuery(final Session session) {
        return isNative ? session.createNativeQuery(query) : session.createQuery(query);
    }

    @Override
    protected Map<String, Object> getParameters() {
        return parameters;
    }

    @Override
    protected Class<Map> getReturnType() {
        return Map.class;
    }
}
