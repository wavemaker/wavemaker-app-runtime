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
