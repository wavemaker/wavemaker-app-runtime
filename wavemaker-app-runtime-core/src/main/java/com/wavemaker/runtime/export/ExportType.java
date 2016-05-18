package com.wavemaker.runtime.export;


import java.io.OutputStream;

import net.sf.dynamicreports.jasper.builder.JasperReportBuilder;
import net.sf.dynamicreports.report.exception.DRException;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 9/5/16
 */
public enum ExportType {
    PDF {
        @Override
        public String getExtention() {
            return ".pdf";
        }

        @Override
        public JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream) {
            try {
                return jasperReportBuilder.toPdf(reportOutputStream);
            } catch (DRException e) {
                throw new RuntimeException("DRException in building jasperReportBuilder ", e);
            }
        }
    },
    ODS {
        @Override
        public String getExtention() {
            return ".ods";
        }

        @Override
        public JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream) {
            try {
                return jasperReportBuilder.toOds(reportOutputStream);
            } catch (DRException e) {
                throw new RuntimeException("DRException in building jasperReportBuilder ", e);
            }
        }
    },
    XLS {
        @Override
        public String getExtention() {
            return ".xls";
        }

        @Override
        public JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream) {
            try {
                return jasperReportBuilder.toXls(reportOutputStream);
            } catch (DRException e) {
                throw new RuntimeException("DRException in building jasperReportBuilder ", e);
            }
        }
    },
    CSV {
        @Override
        public String getExtention() {
            return ".csv";
        }

        @Override
        public JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream) {
            try {
                return jasperReportBuilder.toCsv(reportOutputStream);
            } catch (DRException e) {
                throw new RuntimeException("DRException in building jasperReportBuilder ", e);
            }
        }
    },
    DOCX {
        @Override
        public String getExtention() {
            return ".docx";
        }

        @Override
        public JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream) {
            try {
                return jasperReportBuilder.toDocx(reportOutputStream);
            } catch (DRException e) {
                throw new RuntimeException("DRException in building jasperReportBuilder ", e);
            }
        }
    },
    ODT {
        @Override
        public String getExtention() {
            return "odt";
        }

        @Override
        public JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream) {
            try {
                return jasperReportBuilder.toOdt(reportOutputStream);
            } catch (DRException e) {
                throw new RuntimeException("DRException in building jasperReportBuilder ", e);
            }
        }
    },
    DEFAULT {
        @Override
        public String getExtention() {
            return ".xml";
        }

        @Override
        public JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream) {
            try {
                return jasperReportBuilder.toJrXml(reportOutputStream);
            } catch (DRException e) {
                throw new RuntimeException("DRException in building jasperReportBuilder ", e);
            }
        }
    };

    public abstract String getExtention();

    public abstract JasperReportBuilder formatReport(JasperReportBuilder jasperReportBuilder, OutputStream reportOutputStream);


}
