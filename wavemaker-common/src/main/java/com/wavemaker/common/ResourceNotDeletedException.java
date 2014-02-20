package com.wavemaker.common;

/**
 * Created by gauravs on 18/2/14.
 */
public class ResourceNotDeletedException extends WMRuntimeException {
    private static final long serialVersionUID = -3920445885731314103L;


    public ResourceNotDeletedException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public ResourceNotDeletedException(Throwable cause,MessageResource resource,  Object... args) {
        super(resource, cause, args);
    }

}
