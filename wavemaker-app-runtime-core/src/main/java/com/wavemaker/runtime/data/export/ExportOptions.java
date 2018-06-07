package com.wavemaker.runtime.data.export;


import java.util.ArrayList;
import java.util.List;

public class ExportOptions {
    private List<FieldInfo> fields = new ArrayList<>();
    private ExportType exportType;
    private Integer exportSize = -1;
    private String fileName;

    public ExportOptions(ExportType exportType) {
        this.exportType = exportType;
    }

    public ExportOptions(final ExportType exportType, final Integer exportSize) {
        this.exportType = exportType;
        this.exportSize = exportSize;
    }

    public ExportOptions() {
    }

    public List<FieldInfo> getFields() {
        return fields;
    }

    public void setFields(List<FieldInfo> fields) {
        this.fields = fields;
    }

    public ExportType getExportType() {
        return exportType;
    }

    public void setExportType(ExportType exportType) {
        this.exportType = exportType;
    }

    public Integer getExportSize() {
        return exportSize;
    }

    public void setExportSize(final Integer exportSize) {
        this.exportSize = exportSize;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(final String fileName) {
        this.fileName = fileName;
    }
}
