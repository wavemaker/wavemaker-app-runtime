package com.wavemaker.runtime.data.exception;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 22/2/17
 */
public class TypeMappingException extends WMRuntimeException {

    public TypeMappingException(final MessageResource resource, final Throwable cause, final Object... args) {
        super(resource, cause, args);
    }
}
