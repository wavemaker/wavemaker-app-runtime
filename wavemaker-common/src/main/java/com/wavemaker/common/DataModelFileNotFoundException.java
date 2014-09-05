package com.wavemaker.common;

/**
 * @author Sowmyad
 */
public class DataModelFileNotFoundException extends WMRuntimeException {

    public DataModelFileNotFoundException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public DataModelFileNotFoundException(Throwable cause, MessageResource resource, Object... args) {
        super(resource, cause, args);
    }

    public DataModelFileNotFoundException(String message) {
        super(message, (String) null);
    }

    public DataModelFileNotFoundException(Throwable e, String message) {
        super(message, e);
    }

}
