package com.wavemaker.runtime.rest.service;

import java.lang.reflect.Type;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RequestCallback;
import org.springframework.web.client.ResponseExtractor;
import org.springframework.web.client.RestTemplate;

import com.wavemaker.runtime.util.WMRuntimeUtils;

/**
 * @author Uday Shankar
 */
public class WMRestTemplate extends RestTemplate {

    public WMRestTemplate() {
        super(WMRuntimeUtils.getMessageConverters());
    }

    public RequestCallback getRequestEntityCallBack(Object requestBody) {
        return httpEntityCallback(requestBody);
    }

    public RequestCallback getRequestEntityCallBack(Object requestBody, Type responseType) {
        return httpEntityCallback(requestBody, responseType);
    }

    public <T> ResponseExtractor<ResponseEntity<T>> getResponseEntityExtractor(Type responseType) {
        return responseEntityExtractor(responseType);
    }
}
