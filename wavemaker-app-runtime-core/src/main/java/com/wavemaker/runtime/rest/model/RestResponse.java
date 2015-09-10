package com.wavemaker.runtime.rest.model;

import java.util.List;
import java.util.Map;

import org.apache.http.impl.cookie.BasicClientCookie;


/**
 * @author Uday Shankar
 */
public class RestResponse {

    private String responseBody;

    private String convertedResponse;

    private int statusCode;

    private Map<String, List<String>> responseHeaders;

    private String contentType;

    private List<BasicClientCookie> cookies;

    public List<BasicClientCookie> getCookies() {
        return cookies;
    }

    public void setCookies(final List<BasicClientCookie> cookies) {
        this.cookies = cookies;
    }

    public String getResponseBody() {
        return responseBody;
    }

    public void setResponseBody(String responseBody) {
        this.responseBody = responseBody;
    }

    public String getConvertedResponse() {
        return convertedResponse;
    }

    public void setConvertedResponse(String convertedResponse) {
        this.convertedResponse = convertedResponse;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public Map<String, List<String>> getResponseHeaders() {
        return responseHeaders;
    }

    public void setResponseHeaders(Map<String, List<String>> responseHeaders) {
        this.responseHeaders = responseHeaders;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}
