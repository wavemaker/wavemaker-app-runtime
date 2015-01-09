package com.wavemaker.common.event;

import org.springframework.context.ApplicationEvent;

/**
 * @author Uday Shankar
 */
public abstract class WMEvent extends ApplicationEvent {

    private Object causedBy;

    public WMEvent(String source) {
        super(source);
    }

    public WMEvent(String source, Object causedBy) {
        super(source);
        this.causedBy = causedBy;
    }

    public Object getCausedBy() {
        return causedBy;
    }
}
