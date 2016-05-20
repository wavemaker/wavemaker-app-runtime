package com.wavemaker.runtime.report.model;

import com.wavemaker.runtime.report.export.CsvReportExporter;
import com.wavemaker.runtime.report.export.DocxReportExporter;
import com.wavemaker.runtime.report.export.OdsReportExporter;
import com.wavemaker.runtime.report.export.PdfReportExporter;
import com.wavemaker.runtime.report.export.ReportExporter;
import com.wavemaker.runtime.report.export.XmlReportExporter;

/**
 * Created by kishorer on 18/5/16.
 */
public enum ExportType {

    CSV("csv", ".csv", new CsvReportExporter()),
    DOCX("docx", ".docx", new DocxReportExporter()),
    ODS("ods", ".ods", new OdsReportExporter()),
    PDF("pdf", ".pdf", new PdfReportExporter()),
    XML("xml", ".xml", new XmlReportExporter());

    ExportType(String value, String extension, ReportExporter reportExporter) {
        this.value = value;
        this.extension = extension;
        this.reportExporter = reportExporter;
    }

    private String value;
    private String extension;
    private ReportExporter reportExporter;

    public String getValue() {
        return value;
    }

    public String getExtension() {
        return extension;
    }

    public ReportExporter getReportExporter() {
        return reportExporter;
    }

    public static ExportType getExportTypeByValue(String value) {
        for (ExportType exportType : ExportType.values()) {
            if (exportType.getValue().equals(value)) {
                return exportType;
            }
        }
        throw new IllegalArgumentException("Export type [" + value + "] not supported");
    }
}
