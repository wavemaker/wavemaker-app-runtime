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
package com.wavemaker.runtime.data.filter;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/12/16
 */
public class WMQueryInfo {

    private String query;
    private Map<String, WMQueryParamInfo> parameters;

    public WMQueryInfo(final String query) {
        this.query = query;
        this.parameters = new HashMap<>();
    }

    public WMQueryInfo(final String query, final Map<String, WMQueryParamInfo> parameters) {
        this.query = query;
        this.parameters = parameters;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(final String query) {
        this.query = query;
    }

    public Map<String, WMQueryParamInfo> getParameters() {
        return parameters;
    }

    public void setParameters(final Map<String, WMQueryParamInfo> parameters) {
        this.parameters = parameters;
    }

    public void addParameter(String key, Object value) {
        parameters.put(key, new WMQueryParamInfo(value));
    }

    public void addParameter(String key, WMQueryParamInfo wmQueryParamInfo) {
        parameters.put(key, wmQueryParamInfo);
    }

    public Map<String, Object> getParameterValueMap() {
        return parameters.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, m -> m.getValue().getValue()));
    }

    @Override
    public String toString() {
        return "WMQueryInfo{" +
                "query='" + query + '\'' +
                ", parameters=" + parameters +
                '}';
    }
}
