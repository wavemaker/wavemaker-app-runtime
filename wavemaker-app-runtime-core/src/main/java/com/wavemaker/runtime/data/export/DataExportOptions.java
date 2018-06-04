package com.wavemaker.runtime.data.export;

/**
 * @author Dilip Kumar
 * @since 1/6/18
 */
public class DataExportOptions extends ExportOptions {

    private String query;

    public DataExportOptions() {
    }

    public DataExportOptions(final ExportType exportType, final Integer exportSize, final String query) {
        super(exportType, exportSize);
        this.query = query;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(final String query) {
        this.query = query;
    }
}
