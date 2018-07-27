package com.wavemaker.runtime.data.exception;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/6/17
 */
public class BlobContentNotFoundException extends WMRuntimeException {

    public BlobContentNotFoundException(final String message) {
        super(message);
    }

    public BlobContentNotFoundException(final String message, final Throwable cause) {
        super(message, cause);
    }

    public BlobContentNotFoundException(MessageResource messageResource, Object... args) {
        super(messageResource, args);
    }
}
