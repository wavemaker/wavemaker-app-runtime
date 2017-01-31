/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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

import java.util.Map;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class QueryInfo<T> {

    private final String queryName;
    private final Map<String, Object> params;
    private final Class<T> returnClass;

    public QueryInfo(final String queryName, final Map<String, Object> params, final Class<T> returnClass) {
        this.queryName = queryName;
        this.params = params;
        this.returnClass = returnClass;
    }

    public String getQueryName() {
        return queryName;
    }

    public Map<String, Object> getParams() {
        return params;
    }

    public Class<T> getReturnClass() {
        return returnClass;
    }
}
