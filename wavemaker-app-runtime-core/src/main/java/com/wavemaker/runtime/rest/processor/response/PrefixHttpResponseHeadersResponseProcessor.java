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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpHeaders;

import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;

/**
 * @author Uday Shankar
 */
public class PrefixHttpResponseHeadersResponseProcessor implements HttpResponseProcessor {

    private String headerPrefix = RestConstants.X_WM_HEADER_PREFIX;

    private List<String> defaultResponseHeadersList = Arrays.asList(new String[]{
            HttpHeaders.CONTENT_DISPOSITION,
            HttpHeaders.CONTENT_TYPE,
            HttpHeaders.SET_COOKIE
    });

    @Override
    public void process(HttpResponseProcessorContext httpResponseProcessorContext) {
        HttpResponseDetails httpResponseDetails = httpResponseProcessorContext.getHttpResponseDetails();
        Map<String, List<String>> responseHeaders = httpResponseDetails.getHeaders();
        if (StringUtils.isBlank(headerPrefix) || CollectionUtils.isEmpty(defaultResponseHeadersList)) {
            return;
        }
        List<String> keys = new ArrayList<>(responseHeaders.keySet());
        for (String responseHeaderKey : keys) {
            boolean matched = false;
            for (String defaultResponseHeader : defaultResponseHeadersList) {
                if (StringUtils.equalsIgnoreCase(responseHeaderKey, defaultResponseHeader)) {
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                String updatedResponseHeaderKey = headerPrefix + responseHeaderKey;
                List<String> oldValue = responseHeaders.remove(responseHeaderKey);
                responseHeaders.put(updatedResponseHeaderKey, oldValue);
            }
        }
    }

    public String getHeaderPrefix() {
        return headerPrefix;
    }

    public void setHeaderPrefix(String headerPrefix) {
        this.headerPrefix = headerPrefix;
    }

    public List<String> getDefaultResponseHeadersList() {
        return defaultResponseHeadersList;
    }

    public void setDefaultResponseHeadersList(List<String> defaultResponseHeadersList) {
        this.defaultResponseHeadersList = defaultResponseHeadersList;
    }
}
