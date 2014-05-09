package com.wavemaker.common;

/**
 * @author sunilp
 */
public class DatabaseModelConfigurationException extends WMRuntimeException {

    public DatabaseModelConfigurationException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public DatabaseModelConfigurationException(Throwable cause, MessageResource resource, Object... args) {
        super(resource, cause, args);
    }

    public DatabaseModelConfigurationException(String message) {
        super(message, (String) null);
    }

}
