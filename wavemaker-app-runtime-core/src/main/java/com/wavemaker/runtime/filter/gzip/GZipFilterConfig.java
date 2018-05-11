package com.wavemaker.runtime.filter.gzip;

/**
 * @author Kishore Routhu on 10/10/17 7:15 PM.
 */
public class GZipFilterConfig {

    private boolean enableGZipCompression;

    private int minCompressSize;

    private String includeMimeTypes;

    private String excludeMimeTypes;

    public GZipFilterConfig() {
    }

    public boolean isEnableGZipCompression() {
        return enableGZipCompression;
    }

    public void setEnableGZipCompression(boolean enableGZipCompression) {
        this.enableGZipCompression = enableGZipCompression;
    }

    public int getMinCompressSize() {
        return minCompressSize;
    }

    public void setMinCompressSize(int minCompressSize) {
        this.minCompressSize = minCompressSize;
    }

    public String getIncludeMimeTypes() {
        return includeMimeTypes;
    }

    public void setIncludeMimeTypes(String includeMimeTypes) {
        this.includeMimeTypes = includeMimeTypes;
    }

    public String getExcludeMimeTypes() {
        return excludeMimeTypes;
    }

    public void setExcludeMimeTypes(String excludeMimeTypes) {
        this.excludeMimeTypes = excludeMimeTypes;
    }

}
