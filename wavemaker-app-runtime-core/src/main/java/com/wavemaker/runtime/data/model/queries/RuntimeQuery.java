/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.model.queries;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import javax.validation.constraints.NotNull;

import org.hibernate.validator.constraints.NotEmpty;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 27/9/16
 */
public class RuntimeQuery {

    @NotEmpty
    private String queryString;
    private String countQueryString;

    private boolean nativeSql;
    private boolean fetchCount;

    @NotNull
    private QueryType type;

    private List<QueryParameter> parameters;

    public RuntimeQuery() {
        parameters = new ArrayList<>();
    }

    public RuntimeQuery(
            final String queryString, final boolean nativeSql, final QueryType type,
            final List<QueryParameter> parameters) {
        this.queryString = queryString;
        this.nativeSql = nativeSql;
        this.type = type;
        this.parameters = parameters;
    }

    public RuntimeQuery(final RuntimeQuery other) {
        this.queryString = other.queryString;
        this.type = other.type;
        this.countQueryString = other.countQueryString;
        this.fetchCount = other.fetchCount;
        this.nativeSql = other.nativeSql;
        this.parameters = other.parameters;
    }

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

    public boolean isFetchCount() {
        return fetchCount;
    }

    public void setFetchCount(final boolean fetchCount) {
        this.fetchCount = fetchCount;
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
                ", nativeSql=" + nativeSql +
                ", parameters=" + parameters +
                '}';
    }


}
