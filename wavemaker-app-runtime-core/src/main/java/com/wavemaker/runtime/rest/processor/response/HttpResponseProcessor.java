package com.wavemaker.runtime.rest.processor.response;

/**
 * @author Uday Shankar
 */
public interface HttpResponseProcessor {

    void process(HttpResponseProcessorContext httpResponseProcessorContext);
}
