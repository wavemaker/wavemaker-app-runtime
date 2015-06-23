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

import java.util.HashMap;
import java.util.Map;

import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.studio.common.WMRuntimeException;

/**
 * @author Uday Shankar
 */
public class RestRequestInfo {

    @NotNull
    private String endpointAddress;
    private String method;
    private String contentType;
    private String requestBody;
    private Map<String, Object> headers;
    private RestResponse sampleRestResponse;

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

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getRequestBody() {
        return requestBody;
    }

    public void setRequestBody(String requestBody) {
        this.requestBody = requestBody;
    }

    public RestResponse getSampleRestResponse() {
        return sampleRestResponse;
    }

    public void setSampleRestResponse(RestResponse sampleRestResponse) {
        this.sampleRestResponse = sampleRestResponse;
    }

    public boolean doesHaveAuthorization() {
        if (headers != null) {
            for (String key : headers.keySet()) {
                if (RestConstants.AUTHORIZATION.equals(key)) {
                    return true;
                }
            }
        }
        return false;
    }

    @JsonIgnore
    public String getAuthorization() {
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
    public void setAuthorization(String authorization) {
        headers = (headers == null) ? new HashMap<String, Object>() : headers;
        headers.put(RestConstants.AUTHORIZATION, authorization);
    }


    @Override
    public String toString() {
        return "RestRequestInfo{" +
                "endpointAddress='" + endpointAddress + '\'' +
                ", method='" + method + '\'' +
                ", contentType='" + contentType + '\'' +
                ", requestBody='" + requestBody + '\'' +
                ", headers=" + headers +
                ", sampleRestResponse=" + sampleRestResponse +
                '}';
    }
}
