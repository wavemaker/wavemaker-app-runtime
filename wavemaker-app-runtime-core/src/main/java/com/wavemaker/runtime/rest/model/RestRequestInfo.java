/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.rest.model;

import java.util.HashMap;
import java.util.Map;

import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wavemaker.runtime.commons.model.Proxy;
import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.studio.common.WMRuntimeException;

/**
 * @author Uday Shankar
 */
public class RestRequestInfo {

    public enum AuthType {
        NONE, BASIC, OAUTH;

    }

    @NotNull
    private String endpointAddress;
    private String method;
    private String contentType;
    private Object requestBody;
    private AuthType authType;
    private Map<String, Object> headers;
    private Map<String, Object> queryParams;
    private RestResponse sampleRestResponse;
    private boolean redirectEnabled = true;
    private Proxy proxy;

    public Proxy getProxy() {
        return proxy;
    }

    public void setProxy(Proxy proxy) {
        this.proxy = proxy;
    }

    public boolean isRedirectEnabled() {
        return redirectEnabled;
    }

    public void setRedirectEnabled(final boolean redirectEnabled) {
        this.redirectEnabled = redirectEnabled;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getEndpointAddress() {
        return endpointAddress;
    }

    public void setEndpointAddress(String endpointAddress) {
        this.endpointAddress = endpointAddress;
    }

    public Map<String, Object> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, Object> headers) {
        this.headers = headers;
    }

    public Map<String, Object> getQueryParams() {
        return queryParams;
    }

    public void setQueryParams(Map<String, Object> queryParams) {
        this.queryParams = queryParams;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public Object getRequestBody() {
        return requestBody;
    }

    public void setRequestBody(Object requestBody) {
        this.requestBody = requestBody;
    }

    public RestResponse getSampleRestResponse() {
        return sampleRestResponse;
    }

    public void setSampleRestResponse(RestResponse sampleRestResponse) {
        this.sampleRestResponse = sampleRestResponse;
    }

    public AuthType getAuthType() {
        if (authType == null) {
            authType = AuthType.NONE;
        }
        return authType;
    }

    public void setAuthType(AuthType authType) {
        this.authType = authType;
    }

    @JsonIgnore
    public String getBasicAuthorization() {
        headers = (headers == null) ? new HashMap<String, Object>() : headers;
        for (String key : headers.keySet()) {
            if (RestConstants.AUTHORIZATION.equals(key)) {
                if (headers.get(key) != null) {
                    return headers.get(key).toString();
                }
            }
        }
        throw new WMRuntimeException("Authorization is not there in rest request info");
    }

    @JsonIgnore
    public void setBasicAuthorization(String authorization) {
        headers = (headers == null) ? new HashMap<String, Object>() : headers;
        this.setAuthType(AuthType.BASIC);
        headers.put(RestConstants.AUTHORIZATION, authorization);
    }


    @Override
    public String toString() {
        return "RestRequestInfo{" +
                "endpointAddress='" + endpointAddress + '\'' +
                ", method='" + method + '\'' +
                ", contentType='" + contentType + '\'' +
                ", requestBody=" + requestBody +
                ", authType=" + authType +
                ", headers=" + headers +
                ", queryParams=" + queryParams +
                ", sampleRestResponse=" + sampleRestResponse +
                ", redirectEnabled=" + redirectEnabled +
                ", proxy=" + proxy +
                '}';
    }
}
