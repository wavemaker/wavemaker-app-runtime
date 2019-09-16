package com.wavemaker.runtime.filter.compression;

/**
 * @author Kishore Routhu on 10/10/17 7:15 PM.
 */
public class CompressionFilterConfig {

    private boolean enableCompression;

    private int minCompressSize;

    private String includeMimeTypes;

    private String excludeMimeTypes;

    public CompressionFilterConfig() {
    }

    public boolean isEnableCompression() {
        return enableCompression;
    }

    public void setEnableCompression(boolean enableCompression) {
        this.enableCompression = enableCompression;
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
