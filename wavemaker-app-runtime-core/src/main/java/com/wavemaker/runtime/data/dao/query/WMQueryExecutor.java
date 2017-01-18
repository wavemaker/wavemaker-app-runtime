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
package com.wavemaker.runtime.data.dao.query;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.file.model.Downloadable;

public interface WMQueryExecutor {

    <T> T executeNamedQuery(String queryName, Map<String, Object> params, Class<T> returnType);

    <T> Page<T> executeNamedQuery(String queryName, Map<String, Object> params, Class<T> returnType, Pageable pageable);

    int executeNamedQueryForUpdate(String queryName, Map<String, Object> params);

    Page<Object> executeRuntimeQuery(RuntimeQuery query, Pageable pageable);

    int executeRuntimeQueryForUpdate(RuntimeQuery query);

    @Deprecated
    Page<Object> executeNamedQuery(String queryName, Map<String, Object> params, Pageable pageable);

    @Deprecated
    Page<Object> executeCustomQuery(CustomQuery customQuery, Pageable pageable);

    @Deprecated
    int executeCustomQueryForUpdate(CustomQuery customQuery);

    Downloadable exportNamedQueryData(String queryName, Map<String, Object> params, ExportType exportType,
                                      Class<?> responseType, Pageable pageable);
}
