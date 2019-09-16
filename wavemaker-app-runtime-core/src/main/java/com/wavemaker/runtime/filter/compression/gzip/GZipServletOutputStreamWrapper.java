package com.wavemaker.runtime.filter.compression.gzip;

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

    public GZipServletOutputStreamWrapper(GZipServletResponseWrapper responseWrapper, OutputStream outputStream) throws IOException {
        this.responseWrapper = responseWrapper;
        this.outputStream = outputStream;
    }

    @Override
    public void write(int b) throws IOException {
        getOutputStream().write(b);
    }

    @Override
    public void write(byte[] b) throws IOException {
        getOutputStream().write(b);
    }

    @Override
    public void write(byte[] b, int off, int len) throws IOException {
        getOutputStream().write(b, off, len);
    }

    @Override
    public void flush() throws IOException {
        getOutputStream().flush();
    }

    @Override
    public void close() throws IOException {
        getOutputStream().close();
    }

    private OutputStream getOutputStream() throws IOException {
        if (!streamInitialized) {
            initStream();
        }
        return outputStream;
    }

    private synchronized void initStream() throws IOException {
        if (responseWrapper.isCompressionEnabled()) {
            responseWrapper.setHeader(HttpHeaders.CONTENT_ENCODING, "gzip");
            outputStream = new GZIPOutputStream(outputStream);
        } else {
            responseWrapper.setContentLength(responseWrapper.getOriginalContentLength());
        }
        streamInitialized = true;
    }

    @Override
    public boolean isReady() {
        return false;
    }

    @Override
    public void setWriteListener(WriteListener writeListener) {

    }
}
