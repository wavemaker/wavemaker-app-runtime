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
package com.wavemaker.runtime.data.dao.query;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.export.ExportOptions;
import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.QueryProcedureInput;
import com.wavemaker.runtime.data.model.UpdatableQueryInput;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.file.model.Downloadable;

public interface WMQueryExecutor {

    default <T> T executeNamedQuery(String queryName, Map<String, Object> params, Class<T> returnType) {
        return executeNamedQuery(new QueryProcedureInput<>(queryName, params, returnType));
    }

    <T> T executeNamedQuery(QueryProcedureInput<T> queryInput);

    default <T> Page<T> executeNamedQuery(
            String queryName, Map<String, Object> params, Class<T> returnType, Pageable pageable) {
        return executeNamedQuery(new QueryProcedureInput<>(queryName, params, returnType), pageable);
    }

    <T> Page<T> executeNamedQuery(QueryProcedureInput<T> queryInput, Pageable pageable);

    default int executeNamedQueryForUpdate(String queryName, Map<String, Object> params) {
        return executeNamedQuery(new UpdatableQueryInput(queryName, params));
    }

    int executeNamedQuery(UpdatableQueryInput queryInput);

    Page<Object> executeRuntimeQuery(RuntimeQuery query, Pageable pageable);

    int executeRuntimeQueryForUpdate(RuntimeQuery query);

    default Page<Object> executeNamedQuery(String queryName, Map<String, Object> params, Pageable pageable) {
        return executeNamedQuery(queryName, params, Object.class, pageable);
    }

    @Deprecated
    Page<Object> executeCustomQuery(CustomQuery customQuery, Pageable pageable);

    @Deprecated
    int executeCustomQueryForUpdate(CustomQuery customQuery);

    @Deprecated
    default <T> Downloadable exportNamedQueryData(
            String queryName, Map<String, Object> params, ExportType exportType,
            Class<T> responseType, Pageable pageable) {

        try {
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

                ExportOptions options = new ExportOptions(exportType, pageable.getPageSize());

                exportNamedQueryData(new QueryProcedureInput<>(queryName, params, responseType), options, pageable,
                        outputStream);

                return new DownloadResponse(new ByteArrayInputStream(outputStream.toByteArray()),
                        exportType.getContentType(),
                        queryName + exportType.getExtension());
            }
        } catch (IOException e) {
            throw new WMRuntimeException("Exception while closing out stream", e);
        }
    }

    <T> void exportNamedQueryData(
            QueryProcedureInput<T> queryInput, ExportOptions exportOptions, Pageable pageable,
            OutputStream outputStream);
}
