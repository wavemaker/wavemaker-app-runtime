package com.wavemaker.runtime.report.model;

import java.util.Map;
import java.util.Properties;

/**
 * Created by kishorer on 23/5/16.
 */
public class ReportContext {

    private String reportName;
    private ReportExportType reportExportType;
    private String dataSourceType;

    private Properties properties;
    private Map<String, Object> parameters;

    public ReportContext() {
    }

    public String getReportName() {
        return reportName;
    }

    public void setReportName(String reportName) {
        this.reportName = reportName;
    }

    public ReportExportType getReportExportType() {
        return reportExportType;
    }

    public void setReportExportType(ReportExportType reportExportType) {
        this.reportExportType = reportExportType;
    }

    public String getDataSourceType() {
        return dataSourceType;
    }

    public void setDataSourceType(String dataSourceType) {
        this.dataSourceType = dataSourceType;
    }

    public Properties getProperties() {
        return properties;
    }

    public void setProperties(Properties properties) {
        this.properties = properties;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }
}
