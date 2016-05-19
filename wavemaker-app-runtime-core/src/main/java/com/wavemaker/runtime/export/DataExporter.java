package com.wavemaker.runtime.export;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.io.Serializable;

import org.hibernate.Session;

import net.sf.dynamicreports.jasper.builder.JasperReportBuilder;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 9/5/16
 */
public class DataExporter<Entity extends Serializable> {

    private Class<Entity> entityClass;
    private Session session;
    private ExportType exportType;
    private ExportOptions exportOptions;

    public DataExporter(Session session, Class<Entity> entityClass, ExportType exportType, ExportOptions exportOptions) {
        this.session = session;
        this.entityClass = entityClass;
        this.exportOptions = exportOptions;
        this.exportType = exportType;
    }

    public OutputStream build() {
        ReportBuilder reportBuilder = new ReportBuilder(session, entityClass, exportOptions);
        JasperReportBuilder jasperReportBuilder = reportBuilder.build();

        jasperReportBuilder
                .setTemplate(Templates.reportTemplate)
                .title(Templates.createTitleComponent(entityClass.getName()))
                .highlightDetailOddRows();
        OutputStream reportOutputStream = new ByteArrayOutputStream();
        exportType.formatReport(jasperReportBuilder, reportOutputStream);
        return reportOutputStream;
    }
}
