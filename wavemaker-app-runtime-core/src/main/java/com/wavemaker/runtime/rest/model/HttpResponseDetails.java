/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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

import java.util.Arrays;

import org.springframework.http.HttpHeaders;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.wavemaker.commons.json.deserializer.StringifiedByteArrayDeSerializer;
import com.wavemaker.commons.json.serializer.ByteArrayToStringSerializer;


/**
 * @author Uday Shankar
 */
public class HttpResponseDetails {

    @JsonSerialize(using = ByteArrayToStringSerializer.class)
    @JsonDeserialize(using = StringifiedByteArrayDeSerializer.class)
    private byte[] responseBody;

    @JsonSerialize(using = ByteArrayToStringSerializer.class)
    @JsonDeserialize(using = StringifiedByteArrayDeSerializer.class)
    private byte[] convertedResponse;

    private int statusCode;

    private HttpHeaders headers = new HttpHeaders();

    public HttpResponseDetails() {
    }

    public HttpResponseDetails(HttpResponseDetails httpResponseDetails) {
        if (httpResponseDetails.responseBody != null) {
            this.responseBody = Arrays.copyOf(httpResponseDetails.responseBody, httpResponseDetails.responseBody.length);
        }
        if (httpResponseDetails.convertedResponse != null) {
            this.convertedResponse = Arrays.copyOf(httpResponseDetails.convertedResponse, httpResponseDetails.convertedResponse.length);
        }
        this.statusCode = httpResponseDetails.statusCode;
        this.headers.putAll(httpResponseDetails.headers);
    }

    public byte[] getResponseBody() {
        return responseBody;
    }

    public void setResponseBody(byte[] responseBody) {
        this.responseBody = responseBody;
    }

    public byte[] getConvertedResponse() {
        return convertedResponse;
    }

    public void setConvertedResponse(byte[] convertedResponse) {
        this.convertedResponse = convertedResponse;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public HttpHeaders getHeaders() {
        return headers;
    }

    public void setHeaders(HttpHeaders headers) {
        this.headers = headers;
    }

    @Override
    public String toString() {
        return "HttpResponseDetails{" +
                ", statusCode=" + statusCode +
                ", headers=" + headers +
                '}';
    }
}
