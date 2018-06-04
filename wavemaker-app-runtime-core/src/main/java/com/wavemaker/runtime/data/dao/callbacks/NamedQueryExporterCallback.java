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
package com.wavemaker.runtime.data.dao.callbacks;

import java.io.OutputStream;
import java.sql.ResultSet;

import org.hibernate.Session;
import org.hibernate.query.NativeQuery;
import org.hibernate.query.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateCallback;

import com.wavemaker.runtime.data.dao.query.providers.PaginatedQueryProvider;
import com.wavemaker.runtime.data.dao.query.providers.ParametersProvider;
import com.wavemaker.runtime.data.export.DataExporter;
import com.wavemaker.runtime.data.export.ExportOptions;
import com.wavemaker.runtime.data.export.QueryExtractor;
import com.wavemaker.runtime.data.export.hqlquery.HqlQueryExtractor;
import com.wavemaker.runtime.data.export.nativesql.NativeQueryExtractor;
import com.wavemaker.runtime.data.export.util.DataSourceExporterUtil;
import com.wavemaker.runtime.data.transform.Transformers;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public class NamedQueryExporterCallback<R> implements HibernateCallback<Void> {

    private final PaginatedQueryProvider<R> queryProvider;
    private final ParametersProvider parametersProvider;
    private final Pageable pageable;

    private final ExportOptions exportOptions;
    private final OutputStream outputStream;
    private final Class<R> responseType;

    public NamedQueryExporterCallback(
            final PaginatedQueryProvider<R> queryProvider,
            final ParametersProvider parametersProvider, final Pageable pageable,
            final ExportOptions exportOptions,
            final OutputStream outputStream, final Class<R> responseType) {
        this.queryProvider = queryProvider;
        this.parametersProvider = parametersProvider;
        this.pageable = pageable;
        this.exportOptions = exportOptions;
        this.outputStream = outputStream;
        this.responseType = responseType;
    }


    @Override
    public Void doInHibernate(final Session session) {
        QueryExtractor queryExtractor;
        Query namedQuery = queryProvider.getQuery(session, pageable, parametersProvider);
        final boolean isNative = namedQuery instanceof NativeQuery;
        if (isNative) {
            final ResultSet resultSet = DataSourceExporterUtil.constructResultSet(namedQuery.scroll());
            queryExtractor = new NativeQueryExtractor(resultSet, Transformers.aliasToMappedClass(responseType));
        } else {
            queryExtractor = new HqlQueryExtractor(namedQuery.scroll());
        }
        DataExporter.export(queryExtractor, exportOptions, responseType, outputStream);
        return null;
    }
}

