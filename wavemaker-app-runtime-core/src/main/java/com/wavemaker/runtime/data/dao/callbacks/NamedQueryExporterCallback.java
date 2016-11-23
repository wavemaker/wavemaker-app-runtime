package com.wavemaker.runtime.data.dao.callbacks;

import java.io.ByteArrayOutputStream;
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


    public NamedQueryExporterCallback(
            final String queryName, final Map<String, Object> params, final ExportType exportType,
            final Pageable pageable) {
        this.queryName = queryName;
        this.params = params;
        this.exportType = exportType;
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
            exporter = new HQLQueryDataExporter(namedQuery.scroll(), HQLQueryUtils.extractMetaForHql(namedQuery));
        }
        return exporter.export(exportType);
    }
}

