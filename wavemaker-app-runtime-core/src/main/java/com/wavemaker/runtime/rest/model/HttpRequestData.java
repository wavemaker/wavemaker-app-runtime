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

import org.springframework.http.HttpHeaders;
import org.springframework.util.MultiValueMap;

/**
 * Class used to store the details of the incoming http request from the client
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
