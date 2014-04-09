package com.wavemaker.common;

/**
 * @author sunilp
 */
public class DatabaseConstraintException extends WMRuntimeException {

    public DatabaseConstraintException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public DatabaseConstraintException(Throwable cause, MessageResource resource, Object... args) {
        super(resource, cause, args);
    }
}
