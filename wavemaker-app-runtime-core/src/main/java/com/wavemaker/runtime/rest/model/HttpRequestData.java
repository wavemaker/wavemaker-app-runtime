package com.wavemaker.runtime.rest.model;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.util.MultiValueMap;

/**
 * @author Uday Shankar
 */
public class HttpRequestData {

    private Map<String, String> pathVariablesMap;

    private MultiValueMap<String, String> queryParametersMap;

    private HttpHeaders httpHeaders = new HttpHeaders();

    private byte[] requestBody;

    public HttpHeaders getHttpHeaders() {
        return httpHeaders;
    }

    public void setHttpHeaders(HttpHeaders httpHeaders) {
        this.httpHeaders = httpHeaders;
    }

    public Map<String, String> getPathVariablesMap() {
        return pathVariablesMap;
    }

    public void setPathVariablesMap(Map<String, String> pathVariablesMap) {
        this.pathVariablesMap = pathVariablesMap;
    }

    public byte[] getRequestBody() {
        return requestBody;
    }

    public void setRequestBody(byte[] requestBody) {
        this.requestBody = requestBody;
    }

    public MultiValueMap<String, String> getQueryParametersMap() {
        return queryParametersMap;
    }

    public void setQueryParametersMap(MultiValueMap<String, String> queryParametersMap) {
        this.queryParametersMap = queryParametersMap;
    }
}
