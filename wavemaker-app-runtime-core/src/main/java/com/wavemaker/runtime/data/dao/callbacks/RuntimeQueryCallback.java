package com.wavemaker.runtime.data.dao.callbacks;

import java.util.Map;

import org.hibernate.Session;
import org.hibernate.query.Query;

import com.wavemaker.runtime.data.dao.query.types.ParameterTypeResolver;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/3/17
 */
public class RuntimeQueryCallback extends AbstractQueryCallback<Map<String, Object>> {

    private String query;
    private Map<String, Object> parameters;
    private final ParameterTypeResolver resolver;
    private boolean isNative;

    public RuntimeQueryCallback(
            final String query, final Map<String, Object> parameters,
            final ParameterTypeResolver resolver) {
        this.query = query;
        this.parameters = parameters;
        this.resolver = resolver;
    }

    public RuntimeQueryCallback(
            final String query, final Map<String, Object> parameters,
            final ParameterTypeResolver resolver, final boolean isNative) {
        this.query = query;
        this.parameters = parameters;
        this.resolver = resolver;
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
    protected ParameterTypeResolver getParameterTypeResolver() {
        return resolver;
    }

    @Override
    protected Class<Map> getReturnType() {
        return Map.class;
    }
}
