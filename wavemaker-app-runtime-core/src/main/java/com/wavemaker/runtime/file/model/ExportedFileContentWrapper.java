package com.wavemaker.runtime.file.model;

import java.io.InputStream;

public class ExportedFileContentWrapper {
    private String fileName;
    private InputStream inputStream;

    public ExportedFileContentWrapper(String fileName, InputStream inputStream) {
        this.fileName = fileName;
        this.inputStream = inputStream;
    }

    public String getFileName() {
        return fileName;
    }

    public InputStream getInputStream() {
        return inputStream;
    }
}
