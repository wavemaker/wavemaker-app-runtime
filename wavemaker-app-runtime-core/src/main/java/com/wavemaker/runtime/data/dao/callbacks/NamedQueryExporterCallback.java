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
import java.util.Map;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.query.NativeQuery;
import org.hibernate.query.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate5.HibernateCallback;

import com.wavemaker.runtime.data.dao.util.ParametersConfigurator;
import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.export.DataExporter;
import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.export.QueryExtractor;
import com.wavemaker.runtime.data.export.hqlquery.HqlQueryExtractor;
import com.wavemaker.runtime.data.export.nativesql.NativeQueryExtractor;
import com.wavemaker.runtime.data.export.util.DataSourceExporterUtil;
import com.wavemaker.runtime.data.transform.Transformers;
import com.wavemaker.runtime.data.transform.WMResultTransformer;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public class NamedQueryExporterCallback implements HibernateCallback<ByteArrayOutputStream> {

    private String queryName;
    private Map<String, Object> params;
    private Pageable pageable;
    private ExportType exportType;
    private Class<?> responseType;

    public NamedQueryExporterCallback(
            final String queryName, final Map<String, Object> params, final ExportType exportType,
            Class<?> responseType,
            final Pageable pageable) {
        this.queryName = queryName;
        this.params = params;
        this.exportType = exportType;
        this.responseType = responseType;
        this.pageable = pageable;
    }

    @Override
    public ByteArrayOutputStream doInHibernate(final Session session) throws HibernateException {
        QueryExtractor queryExtractor;
        Query namedQuery = session.getNamedQuery(queryName);
        final boolean isNative = namedQuery instanceof NativeQuery;
        final Sort sort = pageable.getSort();
        if (isNative) {
            namedQuery = QueryHelper
                    .createNewNativeQueryWithSorted(session, (NativeQuery) namedQuery, responseType, sort);
            setQueryProps(namedQuery);
            WMResultTransformer resultTransformer = Transformers.aliasToMappedClass(responseType);
            final ResultSet resultSet = DataSourceExporterUtil.constructResultSet(namedQuery.scroll());
            queryExtractor = new NativeQueryExtractor(resultSet, resultTransformer);
        } else {
            namedQuery = QueryHelper.createNewHqlQueryWithSorted(session, namedQuery, responseType, sort);
            QueryHelper.setResultTransformer(namedQuery, responseType);
            setQueryProps(namedQuery);
            queryExtractor = new HqlQueryExtractor(namedQuery.scroll());
        }
        return DataExporter.export(queryExtractor, exportType);
    }

    private void setQueryProps(final Query namedQuery) {
        ParametersConfigurator.configure(namedQuery, params);
        namedQuery.setFirstResult(pageable.getOffset());
        namedQuery.setMaxResults(pageable.getPageSize());
    }
}

