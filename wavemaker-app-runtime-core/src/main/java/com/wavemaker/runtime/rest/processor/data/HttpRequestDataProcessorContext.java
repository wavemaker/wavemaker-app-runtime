package com.wavemaker.runtime.rest.processor.data;

import javax.servlet.http.HttpServletRequest;

import com.wavemaker.runtime.rest.model.HttpRequestData;

/**
 * @author Uday Shankar
 */
public class HttpRequestDataProcessorContext {

    private HttpServletRequest httpServletRequest;

    private HttpRequestData httpRequestData;

    public HttpRequestDataProcessorContext(HttpServletRequest httpServletRequest, HttpRequestData httpRequestData) {
        this.httpServletRequest = httpServletRequest;
        this.httpRequestData = httpRequestData;
    }

    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }

    public HttpRequestData getHttpRequestData() {
        return httpRequestData;
    }
}
