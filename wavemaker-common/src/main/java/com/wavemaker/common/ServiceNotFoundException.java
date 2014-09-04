package com.wavemaker.common;

/**
 * @author sunilp
 */
public class ServiceNotFoundException extends WMRuntimeException {

    public ServiceNotFoundException(MessageResource resource, Object... args) {
        super(resource, args);
    }

}
