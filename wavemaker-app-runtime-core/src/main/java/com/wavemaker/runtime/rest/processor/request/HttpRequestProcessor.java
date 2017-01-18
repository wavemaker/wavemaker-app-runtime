package com.wavemaker.runtime.rest.processor.request;

/**
 * @author Uday Shankar
 */
public interface HttpRequestProcessor {

    void process(HttpRequestProcessorContext httpRequestProcessorContext);
}
