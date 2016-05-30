package com.wavemaker.runtime.data.export;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.hibernate.Criteria;
import org.hibernate.Session;

import com.wavemaker.runtime.data.JasperType;
import com.wavemaker.runtime.data.util.CriteriaUtils;
import com.wavemaker.runtime.data.util.QueryParser;
import com.wavemaker.runtime.data.util.ReportContext;
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
        ReportContext reportContext = new ReportContext();
        HashMap<String, JasperType> fieldNameVsTypeMap = reportContext.buildFieldNameVsTypeMap(entityClass.getName());
        reportBuilder.setDataSource(constructDataSource());
        List<String> fieldNames = new ArrayList<>(fieldNameVsTypeMap.keySet());

        for (String fieldName : fieldNames) {
            JasperType jasperType = fieldNameVsTypeMap.get(fieldName);
            ColumnBuilder columnBuilder = jasperType.getColumnBuilder(fieldName, fieldName);
            reportBuilder.addColumn(columnBuilder);
            if (jasperType == JasperType.BLOB || jasperType == JasperType.DATETIME || jasperType == JasperType.DATE) {
                reportBuilder.addField(fieldName, Object.class);
            }
        }
        return reportBuilder;
    }

    private List constructDataSource() {
        Criteria criteria = session.createCriteria(entityClass);
        QueryParser queryParser = new QueryParser(entityClass);
        String query = exportOptions.getQuery();
        if (StringUtils.isNotBlank(query)) {
            criteria.add(queryParser.parse(query));
        }
        CriteriaUtils.updateCriteriaForPageable(criteria, exportOptions.getPageable());
        return criteria.list();
    }
}
