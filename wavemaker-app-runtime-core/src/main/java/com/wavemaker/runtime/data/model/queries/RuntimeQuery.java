package com.wavemaker.runtime.data.model.queries;

import java.util.List;
import java.util.Objects;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 27/9/16
 */
public class RuntimeQuery {

    private String queryString;
    private QueryType type;
    private String countQueryString;

    private boolean nativeSql;
    private List<QueryParameter> parameters;

    public String getQueryString() {
        return queryString;
    }

    public void setQueryString(final String queryString) {
        this.queryString = queryString;
    }

    public QueryType getType() {
        return type;
    }

    public void setType(final QueryType type) {
        this.type = type;
    }

    public String getCountQueryString() {
        return countQueryString;
    }

    public void setCountQueryString(final String countQueryString) {
        this.countQueryString = countQueryString;
    }

    public boolean isNativeSql() {
        return nativeSql;
    }

    public void setNativeSql(final boolean nativeSql) {
        this.nativeSql = nativeSql;
    }

    public List<QueryParameter> getParameters() {
        return parameters;
    }

    public void setParameters(final List<QueryParameter> parameters) {
        this.parameters = parameters;
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (!(o instanceof RuntimeQuery)) return false;
        final RuntimeQuery that = (RuntimeQuery) o;
        return isNativeSql() == that.isNativeSql() &&
                Objects.equals(getQueryString(), that.getQueryString()) &&
                Objects.equals(getParameters(), that.getParameters());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getQueryString(), isNativeSql(), getParameters());
    }

    @Override
    public String toString() {
        return "RuntimeQuery{" +
                "query='" + queryString + '\'' +
                ", hql=" + nativeSql +
                ", parameters=" + parameters +
                '}';
    }


}
