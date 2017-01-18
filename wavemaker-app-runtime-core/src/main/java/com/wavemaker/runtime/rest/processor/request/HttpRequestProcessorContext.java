package com.wavemaker.runtime.rest.processor.request;

import javax.servlet.http.HttpServletRequest;

import com.wavemaker.runtime.rest.model.HttpRequestDetails;
import com.wavemaker.runtime.rest.model.HttpRequestData;

/**
 * @author Uday Shankar
 */
public class HttpRequestProcessorContext {

    private HttpServletRequest httpServletRequest;

    private HttpRequestDetails httpRequestDetails;

    private HttpRequestData httpRequestData;

    public HttpRequestProcessorContext(HttpServletRequest httpServletRequest, HttpRequestDetails httpRequestDetails, HttpRequestData httpRequestData) {
        this.httpServletRequest = httpServletRequest;
        this.httpRequestDetails = httpRequestDetails;
        this.httpRequestData = httpRequestData;
    }

    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }

    public HttpRequestDetails getHttpRequestDetails() {
        return httpRequestDetails;
    }

    public HttpRequestData getHttpRequestData() {
        return httpRequestData;
    }
}
