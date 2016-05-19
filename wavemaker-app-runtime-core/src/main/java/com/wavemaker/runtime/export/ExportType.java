package com.wavemaker.runtime.export;


import java.io.OutputStream;

import net.sf.dynamicreports.jasper.builder.JasperReportBuilder;
import net.sf.dynamicreports.report.exception.DRException;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 9/5/16
 */
public enum ExportType {


    EXCEL {
        @Override
        public JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream) {
            try {
                return jasperReportBuilder.toExcelApiXls(reportOutputStream);
            } catch (DRException e) {
                throw new RuntimeException("DRException in building jasperReportBuilder ", e);
            }
        }
    },
    CSV {
        @Override
        public JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream) {
            try {
                return jasperReportBuilder.toCsv(reportOutputStream);
            } catch (DRException e) {
                throw new RuntimeException("DRException in building jasperReportBuilder ", e);
            }
        }
    };

    public abstract JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream);


}
