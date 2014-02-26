package com.wavemaker.common;

/**
 * @author Uday Shankar
 */
public class WMMultiPartFile {

    private String filename;

    private byte[] bytes;

    public WMMultiPartFile() {
    }

    public WMMultiPartFile(String filename, byte[] bytes) {
        this.filename = filename;
        this.bytes = bytes;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public byte[] getBytes() {
        return bytes;
    }

    public void setBytes(byte[] bytes) {
        this.bytes = bytes;
    }
}
