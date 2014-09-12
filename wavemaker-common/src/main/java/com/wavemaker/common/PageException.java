package com.wavemaker.common;

/**
 * @author sunilp
 */
public class PageException extends WMRuntimeException {

    public PageException(MessageResource resource, Object... args) {
        super(resource, args);
    }
}
