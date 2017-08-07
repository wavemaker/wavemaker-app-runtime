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

import java.io.ByteArrayOutputStream;
import java.sql.ResultSet;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.query.NativeQuery;
import org.hibernate.query.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateCallback;

import com.wavemaker.runtime.data.dao.query.providers.PaginatedQueryProvider;
import com.wavemaker.runtime.data.dao.query.providers.ParametersProvider;
import com.wavemaker.runtime.data.export.DataExporter;
import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.export.QueryExtractor;
import com.wavemaker.runtime.data.export.hqlquery.HqlQueryExtractor;
import com.wavemaker.runtime.data.export.nativesql.NativeQueryExtractor;
import com.wavemaker.runtime.data.export.util.DataSourceExporterUtil;
import com.wavemaker.runtime.data.transform.Transformers;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public class NamedQueryExporterCallback<R> implements HibernateCallback<ByteArrayOutputStream> {

    private final PaginatedQueryProvider<R> queryProvider;
    private final ParametersProvider parametersProvider;
    private final Pageable pageable;

    private final ExportType exportType;
    private final Class<R> responseType;

    public NamedQueryExporterCallback(
            final PaginatedQueryProvider<R> queryProvider,
            final ParametersProvider parametersProvider, final Pageable pageable,
            final ExportType exportType,
            final Class<R> responseType) {
        this.queryProvider = queryProvider;
        this.parametersProvider = parametersProvider;
        this.pageable = pageable;
        this.exportType = exportType;
        this.responseType = responseType;
    }


    @Override
    public ByteArrayOutputStream doInHibernate(final Session session) throws HibernateException {
        QueryExtractor queryExtractor;
        Query namedQuery = queryProvider.getQuery(session, pageable, parametersProvider);
        final boolean isNative = namedQuery instanceof NativeQuery;
        if (isNative) {
            final ResultSet resultSet = DataSourceExporterUtil.constructResultSet(namedQuery.scroll());
            queryExtractor = new NativeQueryExtractor(resultSet, Transformers.aliasToMappedClass(responseType));
        } else {
            queryExtractor = new HqlQueryExtractor(namedQuery.scroll());
        }
        return DataExporter.export(queryExtractor, exportType);
    }
}

