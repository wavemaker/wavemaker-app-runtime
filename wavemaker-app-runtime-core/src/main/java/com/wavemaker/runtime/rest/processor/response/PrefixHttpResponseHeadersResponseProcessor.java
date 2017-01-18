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
