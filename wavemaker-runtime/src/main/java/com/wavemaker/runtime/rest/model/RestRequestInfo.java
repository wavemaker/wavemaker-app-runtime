/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.rest.model;

import java.util.Map;

import javax.validation.constraints.NotNull;

/**
 * @author Uday Shankar
 */
public class RestRequestInfo {

    @NotNull
    private String endpointAddress;
    private String method;
    private String contentType;
    private String requestBody;
    private boolean basicAuth;
    private String userName;
    private String password;
    private Map<String, String> headers;
    private RestResponse sampleRestResponse;

    public boolean getBasicAuth() {
        return basicAuth;
    }

    public void setBasicAuth(boolean basicAuth) {
        this.basicAuth = basicAuth;
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

    public Map<String, String> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRequestBody() {
        return requestBody;
    }

    public void setRequestBody(String requestBody) {
        this.requestBody = requestBody;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public RestResponse getSampleRestResponse() {
        return sampleRestResponse;
    }

    public void setSampleRestResponse(RestResponse sampleRestResponse) {
        this.sampleRestResponse = sampleRestResponse;
    }

    @Override
    public String toString() {
        return "RestRequestInfo{" +
                "endpointAddress='" + endpointAddress + '\'' +
                ", method='" + method + '\'' +
                ", contentType='" + contentType + '\'' +
                ", requestBody='" + requestBody + '\'' +
                ", basicAuth=" + basicAuth +
                ", userName='" + userName + '\'' +
                ", password='" + password + '\'' +
                ", headers=" + headers +
                ", sampleRestResponse=" + sampleRestResponse +
                '}';
    }
}
