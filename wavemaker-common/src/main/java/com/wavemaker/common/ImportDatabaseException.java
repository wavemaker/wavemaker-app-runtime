package com.wavemaker.common;

/**
 * @author sunilp
 */
public class ImportDatabaseException extends WMRuntimeException {

    public ImportDatabaseException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public ImportDatabaseException(Throwable cause, MessageResource resource, Object... args) {
        super(resource, cause, args);
    }

    public ImportDatabaseException(String message) {
        super(message, (String) null);
    }

    public ImportDatabaseException(Throwable e, String message) {
        super(message, e);
    }

}
