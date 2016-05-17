package com.wavemaker.runtime.export;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
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

    public File build() {
        ReportBuilder reportBuilder = new ReportBuilder(session, entityClass, exportOptions);
        JasperReportBuilder jasperReportBuilder = reportBuilder.build();

        try {
            jasperReportBuilder
                    .setTemplate(Templates.reportTemplate)
                    .title(Templates.createTitleComponent(entityClass.getName()))
                    .highlightDetailOddRows();
            File reportFile = File.createTempFile("Report", exportType.getExtention());
            OutputStream reportOutputStream = new FileOutputStream(reportFile);
            exportType.formatReport(jasperReportBuilder, reportOutputStream);
            return reportFile;
        } catch (IOException e) {
            throw new RuntimeException("Error while writing into file ", e);
        }
    }
}
