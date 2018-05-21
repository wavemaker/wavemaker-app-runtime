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
import java.util.List;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.http.HttpHeaders;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.rest.model.HttpRequestData;
import com.wavemaker.runtime.rest.model.HttpRequestDetails;

/**
 *
 * Adds default headers if not already exists in HttpRequestDetails
 *
 * @author Uday Shankar
 */
public class PassDefaultHeadersRequestProcessor extends AbstractHttpRequestProcessor implements InitializingBean {

    private List<String> defaultHeaders;

    @Override
    public void afterPropertiesSet() throws Exception {
        if (CollectionUtils.isEmpty(defaultHeaders)) {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.empty.default.headers"));
        }

    }

    @Override
    public void doProcess(HttpRequestProcessorContext httpRequestProcessorContext) {
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

    public void setDefaultHeaders(List<String> defaultHeaders) {
        this.defaultHeaders = defaultHeaders;
    }
}
