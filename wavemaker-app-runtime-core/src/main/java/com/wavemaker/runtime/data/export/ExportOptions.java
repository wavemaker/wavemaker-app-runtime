package com.wavemaker.runtime.data.export;


import java.util.ArrayList;
import java.util.List;

public class ExportOptions {
    private List<FieldInfo> fields = new ArrayList<>();
    private ExportType exportType;

    public ExportOptions(ExportType exportType) {
        this.exportType = exportType;
    }

    public ExportOptions(){}

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

}
