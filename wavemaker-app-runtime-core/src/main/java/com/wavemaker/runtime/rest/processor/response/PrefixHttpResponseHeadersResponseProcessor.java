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
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.InitializingBean;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;

/**
 * @author Uday Shankar
 */
public class PrefixHttpResponseHeadersResponseProcessor extends AbstractHttpResponseProcessor implements InitializingBean {

    private String headerPrefix;

    private List<String> excludeList;

    @Override
    public void afterPropertiesSet() throws Exception {
        if (StringUtils.isBlank(headerPrefix)) {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.empty.header.prefix"));
        }
    }

    @Override
    public void doProcess(HttpResponseProcessorContext httpResponseProcessorContext) {
        HttpResponseDetails httpResponseDetails = httpResponseProcessorContext.getHttpResponseDetails();
        Map<String, List<String>> responseHeaders = httpResponseDetails.getHeaders();
        List<String> keys = new ArrayList<>(responseHeaders.keySet());
        for (String responseHeaderKey : keys) {
            boolean matched = false;
            if (excludeList != null) {
                for (String excludeHeader : excludeList) {
                    if (StringUtils.equalsIgnoreCase(responseHeaderKey, excludeHeader)) {
                        matched = true;
                        break;
                    }
                }
            }
            if (!matched) {
                String updatedResponseHeaderKey = headerPrefix + responseHeaderKey;
                List<String> oldValue = responseHeaders.remove(responseHeaderKey);
                responseHeaders.put(updatedResponseHeaderKey, oldValue);
            }
        }
    }

    public void setHeaderPrefix(String headerPrefix) {
        this.headerPrefix = headerPrefix;
    }

    public void setExcludeList(List<String> excludeList) {
        this.excludeList = excludeList;
    }
}
