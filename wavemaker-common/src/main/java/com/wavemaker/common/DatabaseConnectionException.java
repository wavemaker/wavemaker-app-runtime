package com.wavemaker.common;

/**
 * @author sunilp
 */
public class DatabaseConnectionException extends WMRuntimeException {

    public DatabaseConnectionException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public DatabaseConnectionException(Throwable cause, MessageResource resource, Object... args) {
        super(resource, cause, args);
    }

    public DatabaseConnectionException(String message) {
        super(message, (String) null);
    }

}

