package com.wavemaker.runtime.data.export;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.io.Serializable;

import org.hibernate.Session;

import net.sf.dynamicreports.jasper.builder.JasperReportBuilder;
import net.sf.dynamicreports.report.exception.DRException;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 9/5/16
 */
public class DataExporter<Entity extends Serializable> {

    private Class<Entity> entityClass;
    private Session session;
    private ExportType exportType;
    private ExportOptions exportOptions;

    public DataExporter(
            Session session, Class<Entity> entityClass, ExportType exportType, ExportOptions exportOptions) {
        this.session = session;
        this.entityClass = entityClass;
        this.exportOptions = exportOptions;
        this.exportType = exportType;
    }

    public OutputStream build() {
        ReportGenerator reportGenerator = new ReportGenerator(session, entityClass, exportOptions);
        JasperReportBuilder jasperReportBuilder = reportGenerator.generateReport();

        jasperReportBuilder
                .setTemplate(Templates.reportTemplate)
                .ignorePageWidth()
                .highlightDetailOddRows();
        OutputStream reportOutputStream = new ByteArrayOutputStream();
        try {
            switch (exportType) {
                case EXCEL:
                    jasperReportBuilder.toXls(reportOutputStream);
                    break;
                case CSV:
                    jasperReportBuilder.toCsv(reportOutputStream);
                    break;
            }
        } catch (DRException e) {
            throw new RuntimeException("DRException in building jasperReportBuilder ", e);
        }

        return reportOutputStream;
    }
}
