package com.wavemaker.common;

/**
 * @author sunilp
 */
public class QueryExporterException extends WMRuntimeException {

    public QueryExporterException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public QueryExporterException(Throwable cause, MessageResource resource, Object... args) {
        super(resource, cause, args);
    }

    public QueryExporterException(String message) {
        super(message, (String) null);
    }
}
