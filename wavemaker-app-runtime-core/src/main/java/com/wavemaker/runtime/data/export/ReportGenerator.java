package com.wavemaker.runtime.data.export;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.hibernate.Query;
import org.hibernate.Session;

import com.wavemaker.runtime.data.Types;
import com.wavemaker.runtime.data.util.HQLQueryUtils;
import com.wavemaker.runtime.data.util.TypeInformation;
import com.wavemaker.runtime.data.util.TypeMapBuilder;
import net.sf.dynamicreports.jasper.builder.JasperReportBuilder;
import net.sf.dynamicreports.report.builder.column.ColumnBuilder;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 9/5/16
 */
public class ReportGenerator {

    private Class<?> entityClass;
    private Session session;
    private ExportOptions exportOptions;

    public ReportGenerator(Session session, Class<?> entityClass, ExportOptions exportOptions) {
        this.session = session;
        this.entityClass = entityClass;
        this.exportOptions = exportOptions;
    }

    public JasperReportBuilder generateReport() {
        JasperReportBuilder reportBuilder = new JasperReportBuilder();

        TypeInformation typeInformation = TypeMapBuilder.buildFieldNameVsTypeMap(entityClass, false);
        Map<String, Types> fieldNameVsTypeMap = typeInformation.getFieldVsTypeMap();
        reportBuilder.setDataSource(constructDataSource());
        List<String> fieldNames = new ArrayList<>(fieldNameVsTypeMap.keySet());

        for (String fieldName : fieldNames) {
            Types types = fieldNameVsTypeMap.get(fieldName);
            ColumnBuilder columnBuilder = types.getColumnBuilder(fieldName, fieldName);
            reportBuilder.addColumn(columnBuilder);
            if (types == Types.BLOB || types == Types.DATETIME || types == Types.DATE) {
                reportBuilder.addField(fieldName, Object.class);
            }
        }
        return reportBuilder;
    }

    private List constructDataSource() {
        Query hqlQuery = HQLQueryUtils.createHQLQuery(entityClass.getName(), exportOptions.getQuery(), exportOptions.getPageable(), session);
        return hqlQuery.list();
    }
}
