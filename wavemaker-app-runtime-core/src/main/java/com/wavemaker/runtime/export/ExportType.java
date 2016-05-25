package com.wavemaker.runtime.export;


/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 9/5/16
 */
public enum ExportType {
    EXCEL (".xlsx"),
    CSV (".csv");

    private String extension;

    ExportType(String extension) {
        this.extension = extension;
    }

    public String getExtension() {
        return extension;
    }
}
