package com.wavemaker.runtime.rest.processor.response;

import javax.servlet.http.HttpServletRequest;

import com.wavemaker.runtime.rest.model.HttpRequestDetails;
import com.wavemaker.runtime.rest.model.HttpRequestData;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;

/**
 * @author Uday Shankar
 */
public class HttpResponseProcessorContext {

    private HttpServletRequest httpServletRequest;

    private HttpResponseDetails httpResponseDetails;

    private HttpRequestDetails httpRequestDetails;

    private HttpRequestData httpRequestData;

    public HttpResponseProcessorContext(HttpServletRequest httpServletRequest, HttpResponseDetails httpResponseDetails, HttpRequestDetails httpRequestDetails, HttpRequestData httpRequestData) {
        this.httpServletRequest = httpServletRequest;
        this.httpResponseDetails = httpResponseDetails;
        this.httpRequestDetails = httpRequestDetails;
        this.httpRequestData = httpRequestData;
    }

    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }

    public HttpResponseDetails getHttpResponseDetails() {
        return httpResponseDetails;
    }

    public HttpRequestDetails getHttpRequestDetails() {
        return httpRequestDetails;
    }

    public HttpRequestData getHttpRequestData() {
        return httpRequestData;
    }
}
