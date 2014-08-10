package com.wavemaker.common.event;

import org.springframework.context.ApplicationEvent;

/**
 * @author Uday Shankar
 */
public abstract class WMEvent extends ApplicationEvent {

    public WMEvent(String source) {
        super(source);
    }
}
