package com.wavemaker.common;

/**
 * @author sunilp
 */
public class DatabaseScriptExecutionException extends WMRuntimeException {

    public DatabaseScriptExecutionException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public DatabaseScriptExecutionException(Throwable cause, MessageResource resource, Object... args) {
        super(resource, cause, args);
    }

    public DatabaseScriptExecutionException(String message, Throwable e) {
        super(message, e);
    }

}
