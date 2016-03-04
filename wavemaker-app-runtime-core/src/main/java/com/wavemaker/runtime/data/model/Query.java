/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.model;

import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.NotEmpty;

import java.util.ArrayList;
import java.util.List;

/**
 * @author sunilp
 */
public class Query {

    @NotBlank
    @NotEmpty
    private String name = null;

    @NotBlank
    @NotEmpty
    private String query = null;

    private String comment = null;
    private String description = null;
    private boolean nativeSql = false;
    private boolean returnsSingleResult = false;

    private List<QueryParam> queryParams = new ArrayList<QueryParam>();

    private String outputType;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isNativeSql() {
        return nativeSql;
    }

    public void setNativeSql(boolean isHQL) {
        this.nativeSql = isHQL;
    }

    public boolean isReturnsSingleResult() {
        return returnsSingleResult;
    }

    public void setReturnsSingleResult(boolean returnsSingleResult) {
        this.returnsSingleResult = returnsSingleResult;
    }

    public List<QueryParam> getQueryParams() {
        return queryParams;
    }

    public void setQueryParams(List<QueryParam> queryParams) {
        this.queryParams = queryParams;
    }

    public String getOutputType() {
        return outputType;
    }

    public void setOutputType(String outputType) {
        this.outputType = outputType;
    }
}
