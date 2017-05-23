package com.wavemaker.runtime.rest.processor.request;

/**
 * Created by srujant on 21/5/17.
 */
public abstract class AbstractHttpRequestProcessor implements HttpRequestProcessor {
    protected boolean enabled;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }


    public void process(HttpRequestProcessorContext httpRequestProcessorContext) {
        if (isEnabled()) {
            doProcess(httpRequestProcessorContext);
        }
    }

    protected abstract void doProcess(HttpRequestProcessorContext httpRequestProcessorContext);


}