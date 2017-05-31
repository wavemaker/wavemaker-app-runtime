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
package com.wavemaker.runtime.rest.processor.data;

import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.HttpRequestData;
import com.wavemaker.runtime.rest.util.HttpResponseUtils;

/**
 *
 * 1)Removes headers which have an corresponding X-WM prefixed headers
 *
 * 2) Removes all X-WM- query parameters and adds them in headers for form post requests.
 * This is to support headers in form post in some browsers which cannot send them in the actual headers.
 *
 * @author Uday Shankar
 */
public class XWMPrefixDataProcessor implements HttpRequestDataProcessor {

    @Override
    public void process(HttpRequestDataProcessorContext httpRequestDataProcessorContext) {
        HttpRequestData httpRequestData = httpRequestDataProcessorContext.getHttpRequestData();
        processXWMHeaders(httpRequestData);
        processXWMQueryParams(httpRequestData);
    }

    private void processXWMHeaders(HttpRequestData httpRequestData) {
        MultiValueMap<String, String> headers = httpRequestData.getHttpHeaders();
        Iterator<Map.Entry<String, List<String>>> iterator = headers.entrySet().iterator();
        MultiValueMap<String, String> newHeaders = new LinkedMultiValueMap<>();
        while (iterator.hasNext()) {
            Map.Entry<String, List<String>> next = iterator.next();
            String queryParamKey = next.getKey();
            if (queryParamKey.toUpperCase().startsWith(RestConstants.X_WM_HEADER_PREFIX)) {
                String substring = queryParamKey.substring(RestConstants.X_WM_HEADER_PREFIX.length());
                if (!substring.isEmpty()) {
                    iterator.remove();
                    newHeaders.put(substring, next.getValue());
                }
            }
        }
        headers.putAll(newHeaders);
    }

    private void processXWMQueryParams(HttpRequestData httpRequestData) {
        HttpHeaders httpHeaders = httpRequestData.getHttpHeaders();
        MediaType contentType = httpHeaders.getContentType();
        if (contentType != null && StringUtils.equalsIgnoreCase(HttpResponseUtils.toStringWithoutParameters(contentType), MediaType.APPLICATION_FORM_URLENCODED_VALUE) ) {
            MultiValueMap<String, String> queryParametersMap = httpRequestData.getQueryParametersMap();
            Iterator<Map.Entry<String, List<String>>> iterator = queryParametersMap.entrySet().iterator();
            while (iterator.hasNext()) {
                Map.Entry<String, List<String>> next = iterator.next();
                String queryParamKey = next.getKey();
                if (queryParamKey.toUpperCase().startsWith(RestConstants.X_WM_HEADER_PREFIX)) {
                    String substring = queryParamKey.substring(RestConstants.X_WM_HEADER_PREFIX.length());
                    if (!substring.isEmpty()) {
                        iterator.remove();
                        httpHeaders.put(substring, next.getValue());
                    }
                }
            }
        }
    }
}
