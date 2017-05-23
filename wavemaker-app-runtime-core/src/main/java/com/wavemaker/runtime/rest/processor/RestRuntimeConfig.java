package com.wavemaker.runtime.rest.processor;

import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.rest.processor.request.HttpRequestProcessor;
import com.wavemaker.runtime.rest.processor.response.HttpResponseProcessor;

/**
 * Created by srujant on 19/5/17.
 */
public class RestRuntimeConfig {

    List<HttpRequestProcessor> httpRequestProcessorList;
    List<HttpResponseProcessor> httpResponseProcessorList;

    public RestRuntimeConfig() {
    }

    public RestRuntimeConfig(final RestRuntimeConfig restRuntimeConfig) {
        this.httpRequestProcessorList = new ArrayList<>(restRuntimeConfig.getHttpRequestProcessorList());
        this.httpResponseProcessorList = new ArrayList<>(restRuntimeConfig.getHttpResponseProcessorList());
    }

    public List<HttpRequestProcessor> getHttpRequestProcessorList() {
        return httpRequestProcessorList;
    }

    public void setHttpRequestProcessorList(List<HttpRequestProcessor> httpRequestProcessorList) {
        this.httpRequestProcessorList = httpRequestProcessorList;
    }

    public List<HttpResponseProcessor> getHttpResponseProcessorList() {
        return httpResponseProcessorList;
    }

    public void setHttpResponseProcessorList(List<HttpResponseProcessor> httpResponseProcessorList) {
        this.httpResponseProcessorList = httpResponseProcessorList;
    }

}
