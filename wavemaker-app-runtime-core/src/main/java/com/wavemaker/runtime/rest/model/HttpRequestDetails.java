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

import java.io.InputStream;
import javax.validation.constraints.NotNull;

import org.springframework.http.HttpHeaders;

import com.fasterxml.jackson.annotation.JsonIgnore;


/**
 * Class used to represent the details of the http request which can be invoked
 * @author Uday Shankar
 */
public class HttpRequestDetails {

    @NotNull
    private String endpointAddress;

    private String method;

    @JsonIgnore
    private InputStream body;

    private HttpHeaders headers = new HttpHeaders();

    private boolean redirectEnabled = true;

    //Needed for jackson deserialization
    public HttpRequestDetails() {
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

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public InputStream getBody() {
        return body;
    }

    public void setBody(InputStream body) {
        this.body = body;
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("HttpRequestDetails{");
        sb.append("endpointAddress='").append(endpointAddress).append('\'');
        sb.append(", method='").append(method).append('\'');
        sb.append(", headers=").append(headers);
        sb.append(", redirectEnabled=").append(redirectEnabled);
        sb.append('}');
        return sb.toString();
    }
}
