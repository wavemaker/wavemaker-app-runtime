package com.wavemaker.runtime.data.model;

import java.util.Map;

/**
 * @author Dilip Kumar
 * @since 1/6/18
 */
public class QueryProcedureInput<T> {

    private final String name;
    private final Map<String, Object> parameters;
    private final Class<T> responseType;

    public QueryProcedureInput(final String name, final Map<String, Object> parameters, final Class<T> responseType) {
        this.name = name;
        this.parameters = parameters;
        this.responseType = responseType;
    }

    public String getName() {
        return name;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public Class<T> getResponseType() {
        return responseType;
    }
}
