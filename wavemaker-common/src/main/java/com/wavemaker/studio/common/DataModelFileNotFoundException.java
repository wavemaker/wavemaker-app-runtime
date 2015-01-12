package com.wavemaker.studio.common;

/**
 * @author Sowmyad
 */
public class DataModelFileNotFoundException extends WMRuntimeException {

    public DataModelFileNotFoundException(MessageResource resource, Object... args) {
        super(resource, args);
    }

}
