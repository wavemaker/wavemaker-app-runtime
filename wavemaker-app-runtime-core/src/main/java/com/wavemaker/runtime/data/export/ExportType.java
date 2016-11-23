package com.wavemaker.runtime.data.export;


/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 9/5/16
 */
public enum ExportType {
    EXCEL(".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    CSV(".csv", "text/csv");

    private String extension;

    private String contentType;

    ExportType(String extension, String contentType) {
        this.extension = extension;
        this.contentType = contentType;
    }

    public String getExtension() {
        return extension;
    }

    public String getContentType() {
        return contentType;
    }
}
