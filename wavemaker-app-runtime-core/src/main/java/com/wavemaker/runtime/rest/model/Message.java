package com.wavemaker.runtime.rest.model;

import java.io.InputStream;

import org.springframework.http.HttpHeaders;

/**
 * Created by srujant on 18/1/17.
 */
public class Message {

    private HttpHeaders httpHeaders;
    private InputStream inputStream;

    public HttpHeaders getHttpHeaders() {
        return httpHeaders;
    }

    public void setHttpHeaders(HttpHeaders httpHeaders) {
        this.httpHeaders = httpHeaders;
    }

    public InputStream getInputStream() {
        return inputStream;
    }

    public void setInputStream(InputStream inputStream) {
        this.inputStream = inputStream;
    }



}
