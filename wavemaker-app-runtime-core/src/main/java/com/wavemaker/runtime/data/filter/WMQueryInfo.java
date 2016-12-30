package com.wavemaker.runtime.data.filter;

import java.util.HashMap;
import java.util.Map;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/12/16
 */
public class WMQueryInfo {

    private String query;
    private Map<String, Object> parameters;

    public WMQueryInfo(final String query) {
        this.query = query;
        this.parameters = new HashMap<>();
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(final String query) {
        this.query = query;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(final Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public void addParameter(String name, Object value) {
        this.getParameters().put(name, value);
    }

    @Override
    public String toString() {
        return "WMQueryInfo{" +
                "query='" + query + '\'' +
                ", parameters=" + parameters +
                '}';
    }
}
