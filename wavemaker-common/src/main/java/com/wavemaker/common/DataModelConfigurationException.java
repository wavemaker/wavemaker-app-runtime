package com.wavemaker.common;

/**
 * @author sunilp
 */
public class DataModelConfigurationException extends WMRuntimeException {

    public DataModelConfigurationException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public DataModelConfigurationException(Throwable cause, MessageResource resource, Object... args) {
        super(resource, cause, args);
    }

    public DataModelConfigurationException(String message) {
        super(message, (String) null);
    }
}