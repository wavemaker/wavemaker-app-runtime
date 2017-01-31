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
package com.wavemaker.runtime.data.dao.callbacks;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate4.HibernateCallback;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.export.DataExporter;
import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.export.hqlquery.HQLQueryDataExporter;
import com.wavemaker.runtime.data.export.nativesql.NativeSQLDataExporter;
import com.wavemaker.runtime.data.export.util.DataSourceExporterUtil;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.util.HQLQueryUtils;

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

    private static Map<String, List<ReturnProperty>> queryNameVsMetaData = new HashMap<>();

    public NamedQueryExporterCallback(
            final String queryName, final Map<String, Object> params, final ExportType exportType,Class<?> responseType,
            final Pageable pageable) {
        this.queryName = queryName;
        this.params = params;
        this.exportType = exportType;
        this.responseType = responseType;
        this.pageable = pageable;
    }

    @Override
    public ByteArrayOutputStream doInHibernate(final Session session) throws HibernateException {
        final DataExporter exporter;
        Query namedQuery = session.getNamedQuery(queryName);
        QueryHelper.configureParameters(namedQuery, params);
        final boolean isNative = namedQuery instanceof SQLQuery;
        namedQuery.setFirstResult(pageable.getOffset());
        namedQuery.setMaxResults(pageable.getPageSize());
        if (isNative) {
            exporter = new NativeSQLDataExporter(DataSourceExporterUtil.constructResultSet(namedQuery.scroll()));
        } else {
            if(!queryNameVsMetaData.containsKey(queryName)){
                queryNameVsMetaData.put(queryName, buildMetaData(namedQuery));
            }
            exporter = new HQLQueryDataExporter(namedQuery.scroll(), queryNameVsMetaData.get(queryName));
        }
        return exporter.export(exportType, responseType);
    }

    private List<ReturnProperty> buildMetaData(Query query){
        return HQLQueryUtils.extractMetaForHql(query);
    }
}

