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
package com.wavemaker.runtime.rest.processor.request;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.http.HttpHeaders;

import com.wavemaker.runtime.rest.model.HttpRequestDetails;
import com.wavemaker.runtime.rest.model.HttpRequestData;

/**
 *
 * Adds default headers if not already exists in HttpRequestDetails
 *
 * @author Uday Shankar
 */
public class PassDefaultHeadersRequestProcessor  implements HttpRequestProcessor {

    private List<String> defaultHeaders = Arrays.asList(new String[]{
            HttpHeaders.USER_AGENT,
            HttpHeaders.CONTENT_TYPE,
            HttpHeaders.ACCEPT,
            HttpHeaders.ACCEPT_CHARSET,
            HttpHeaders.ACCEPT_LANGUAGE});

    @Override
    public void process(HttpRequestProcessorContext httpRequestProcessorContext) {
        HttpRequestData httpRequestData = httpRequestProcessorContext.getHttpRequestData();
        HttpRequestDetails httpRequestDetails = httpRequestProcessorContext.getHttpRequestDetails();
        HttpHeaders httpRequestHeaders = httpRequestDetails.getHeaders();

        for (String headerKey : this.defaultHeaders) {
            if (!httpRequestHeaders.containsKey(headerKey)) {
                List<String> headersValue = httpRequestData.getHttpHeaders().get(headerKey);
                if (CollectionUtils.isNotEmpty(headersValue)) {
                    httpRequestHeaders.put(headerKey, new ArrayList<>(headersValue));
                }
            }
        }
    }
}
