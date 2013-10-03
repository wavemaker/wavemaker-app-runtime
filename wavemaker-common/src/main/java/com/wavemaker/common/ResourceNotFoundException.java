package com.wavemaker.common;

/**
 * @author Uday Shankar
 */
public class ResourceNotFoundException extends WMRuntimeException {


    public ResourceNotFoundException(MessageResource resource) {
        super(resource);
    }

    public ResourceNotFoundException(MessageResource resource, Throwable cause) {
        super(resource, cause);
    }

    public ResourceNotFoundException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public ResourceNotFoundException(MessageResource resource, Throwable cause, Object... args) {
        super(resource, cause, args);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public ResourceNotFoundException(String message, String detailedMessage) {
        super(message, detailedMessage);
    }

    public ResourceNotFoundException(String message, String detailedMessage, Integer msgId) {
        super(message, detailedMessage, msgId);
    }

    public ResourceNotFoundException(String message, String detailedMessage, Throwable cause) {
        super(message, detailedMessage, cause);
    }

    public ResourceNotFoundException(String message, String detailedMessage, Integer msgId, Throwable cause) {
        super(message, detailedMessage, msgId, cause);
    }

    public ResourceNotFoundException(Throwable cause) {
        super(cause);
    }
}
