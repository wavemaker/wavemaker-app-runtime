package com.wavemaker.common;

/**
 * @author Uday Shankar
 */
public class InvalidInputException extends WMRuntimeException {

    public InvalidInputException(MessageResource resource, Object... args) {
        super(resource, args);
    }
}
