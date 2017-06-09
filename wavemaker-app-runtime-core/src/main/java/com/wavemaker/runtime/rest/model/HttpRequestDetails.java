/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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

import org.springframework.http.HttpHeaders;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.wavemaker.commons.json.deserializer.StringifiedByteArrayDeSerializer;
import com.wavemaker.commons.json.serializer.ByteArrayToStringSerializer;
import com.wavemaker.runtime.commons.model.Proxy;

/**
 * Class used to represent the details of the http request which can be invoked
 * @author Uday Shankar
 */
public class HttpRequestDetails {

    @NotNull
    private String endpointAddress;

    private String method;

    @JsonSerialize(using = ByteArrayToStringSerializer.class)
    @JsonDeserialize(using = StringifiedByteArrayDeSerializer.class)
    private byte[] requestBody;

    private HttpHeaders headers = new HttpHeaders();

    private Map<String, Object> queryParams;
    
    private boolean redirectEnabled = true;

    private Proxy proxy;

    public HttpRequestDetails() {
    }

    public HttpRequestDetails(HttpRequestDetails httpRequestDetails) {
        this.endpointAddress = httpRequestDetails.endpointAddress;
        this.method = httpRequestDetails.method;
        this.requestBody = httpRequestDetails.requestBody;
        this.headers.putAll(httpRequestDetails.headers);
        this.queryParams = httpRequestDetails.queryParams;
        this.redirectEnabled = httpRequestDetails.redirectEnabled;
        if (proxy != null) {
            this.proxy = new Proxy(httpRequestDetails.proxy);
        }
    }

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

    public String getEndpointAddress() {
        return endpointAddress;
    }

    public void setEndpointAddress(String endpointAddress) {
        this.endpointAddress = endpointAddress;
    }

    public HttpHeaders getHeaders() {
        return headers;
    }

    public void setHeaders(HttpHeaders headers) {
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

    public byte[] getRequestBody() {
        return requestBody;
    }

    public void setRequestBody(byte[] requestBody) {
        this.requestBody = requestBody;
    }

    @Override
    public String toString() {
        return "HttpRequestDetails{" +
                "endpointAddress='" + endpointAddress + '\'' +
                ", method='" + method + '\'' +
                ", requestBody=" + requestBody +
                ", headers=" + headers +
                ", queryParams=" + queryParams +
                ", redirectEnabled=" + redirectEnabled +
                ", proxy=" + proxy +
                '}';
    }
}
