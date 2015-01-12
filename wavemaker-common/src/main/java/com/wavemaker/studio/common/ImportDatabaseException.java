package com.wavemaker.studio.common;

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

}
