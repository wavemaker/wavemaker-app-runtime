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
package com.wavemaker.runtime.rest.processor.response;

import javax.servlet.http.HttpServletRequest;

import com.wavemaker.runtime.rest.model.HttpRequestData;
import com.wavemaker.runtime.rest.model.HttpRequestDetails;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;

/**
 * @author Uday Shankar
 */
public class HttpResponseProcessorContext {

    private HttpServletRequest httpServletRequest;

    private HttpResponseDetails httpResponseDetails;

    private HttpRequestDetails httpRequestDetails;

    private HttpRequestData httpRequestData;

    public HttpResponseProcessorContext(HttpServletRequest httpServletRequest, HttpResponseDetails httpResponseDetails, HttpRequestDetails httpRequestDetails, HttpRequestData httpRequestData) {
        this.httpServletRequest = httpServletRequest;
        this.httpResponseDetails = httpResponseDetails;
        this.httpRequestDetails = httpRequestDetails;
        this.httpRequestData = httpRequestData;
    }

    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }

    public HttpResponseDetails getHttpResponseDetails() {
        return httpResponseDetails;
    }

    public HttpRequestDetails getHttpRequestDetails() {
        return httpRequestDetails;
    }

    public HttpRequestData getHttpRequestData() {
        return httpRequestData;
    }
}
