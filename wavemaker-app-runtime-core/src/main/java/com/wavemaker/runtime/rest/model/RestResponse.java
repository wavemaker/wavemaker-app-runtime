/**
 * Copyright © 2015 WaveMaker, Inc.
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

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.wavemaker.studio.common.json.serializer.ByteArrayToStringSerializer;
import com.wavemaker.studio.common.json.deserializer.StringifiedByteArrayDeSerializer;
import org.apache.http.impl.cookie.BasicClientCookie;

import java.util.List;
import java.util.Map;


/**
 * @author Uday Shankar
 */
public class RestResponse {

    @JsonSerialize(using = ByteArrayToStringSerializer.class)
    @JsonDeserialize(using = StringifiedByteArrayDeSerializer.class)
    private byte[] responseBody;

    @JsonSerialize(using = ByteArrayToStringSerializer.class)
    @JsonDeserialize(using = StringifiedByteArrayDeSerializer.class)
    private byte[] convertedResponse;

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

    @Override
    public String toString() {
        return "RestResponse{" +
                ", statusCode=" + statusCode +
                ", contentType='" + contentType + '\'' +
                ", responseHeaders=" + responseHeaders +
                ", cookies=" + cookies +
                '}';
    }
}
