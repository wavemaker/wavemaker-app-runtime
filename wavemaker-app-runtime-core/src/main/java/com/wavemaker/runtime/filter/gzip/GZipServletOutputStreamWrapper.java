package com.wavemaker.runtime.filter.gzip;

import java.io.IOException;
import java.io.OutputStream;
import java.util.zip.GZIPOutputStream;

import javax.servlet.ServletOutputStream;
import javax.servlet.WriteListener;

import org.springframework.http.HttpHeaders;

/**
 * @author Kishore Routhu on 10/10/17 6:47 PM.
 */
public class GZipServletOutputStreamWrapper extends ServletOutputStream {

    private GZipServletResponseWrapper responseWrapper;
    private OutputStream outputStream;
    private boolean streamInitialized = false;
    private boolean headersAdded = false;

    public GZipServletOutputStreamWrapper(GZipServletResponseWrapper responseWrapper, OutputStream outputStream) throws IOException {
        this.responseWrapper = responseWrapper;
        this.outputStream = outputStream;
    }

    @Override
    public void write(int b) throws IOException {
        getOutputStream(true).write(b);
    }

    @Override
    public void write(byte[] b) throws IOException {
        getOutputStream(true).write(b);
    }

    @Override
    public void write(byte[] b, int off, int len) throws IOException {
        getOutputStream(true).write(b, off, len);
    }

    @Override
    public void flush() throws IOException {
        getOutputStream(false).flush();
    }

    @Override
    public void close() throws IOException {
        getOutputStream(false).close();
    }

    private OutputStream getOutputStream(boolean withHeaders) throws IOException {
        if (!streamInitialized && responseWrapper.isCompressionEnabled()) {
            outputStream = new GZIPOutputStream(outputStream);
        }
        if (withHeaders) {
            writeHeaders();
        }
        streamInitialized = true;
        return outputStream;
    }

    private void writeHeaders() {
        if (headersAdded) {
            return;
        }

        if (responseWrapper.isCompressionEnabled()) {
            responseWrapper.setHeader(HttpHeaders.CONTENT_ENCODING, "gzip");
        } else {
            responseWrapper.setContentLength(responseWrapper.getContentLength());
        }
        headersAdded = true;
    }

    @Override
    public boolean isReady() {
        return false;
    }

    @Override
    public void setWriteListener(WriteListener writeListener) {

    }
}
