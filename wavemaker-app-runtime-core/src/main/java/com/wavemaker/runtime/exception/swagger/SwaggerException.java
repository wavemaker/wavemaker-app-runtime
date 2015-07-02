package com.wavemaker.runtime.exception.swagger;

import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.WMRuntimeException;

/**
 * Created by sunilp on 6/6/15.
 */
public class SwaggerException extends WMRuntimeException {

    public SwaggerException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public SwaggerException(String message, Throwable cause) {
        super(message, cause);
    }

    public SwaggerException(String message) {
        super(message);
    }
}

