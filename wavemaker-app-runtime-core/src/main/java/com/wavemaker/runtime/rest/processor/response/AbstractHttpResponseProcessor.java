package com.wavemaker.runtime.rest.processor.response;

/**
 * Created by srujant on 21/5/17.
 */
public abstract class AbstractHttpResponseProcessor implements HttpResponseProcessor {
    protected boolean enabled;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    public void process(HttpResponseProcessorContext httpResponseProcessorContext) {
        if (isEnabled()) {
            doProcess(httpResponseProcessorContext);
        }
    }

    protected abstract void doProcess(HttpResponseProcessorContext httpResponseProcessorContext);
}
