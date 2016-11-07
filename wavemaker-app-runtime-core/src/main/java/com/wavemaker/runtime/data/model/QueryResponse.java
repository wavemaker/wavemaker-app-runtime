/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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
package com.wavemaker.runtime.data.model;

import java.util.List;

import com.wavemaker.runtime.data.model.returns.ReturnProperty;

/**
 * @author sowmyad
 * @author Dilip Kumar
 */
public class QueryResponse {
    private Object results;
    private List<ReturnProperty> returnProperties;

    public QueryResponse() {
    }

    public QueryResponse(
            final Object results, final List<ReturnProperty> returnProperties) {
        this.results = results;
        this.returnProperties = returnProperties;
    }

    public Object getResults() {
        return results;
    }

    public void setResults(final Object results) {
        this.results = results;
    }

    public List<ReturnProperty> getReturnProperties() {
        return returnProperties;
    }

    public void setReturnProperties(
            final List<ReturnProperty> returnProperties) {
        this.returnProperties = returnProperties;
    }
}
