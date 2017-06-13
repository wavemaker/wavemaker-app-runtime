package com.wavemaker.runtime.data.exception;

import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 13/6/17
 */
public class MultipleRecordsException extends WMRuntimeException {

    public MultipleRecordsException(final String message) {
        super(message);
    }

    public MultipleRecordsException(final String message, final Throwable cause) {
        super(message, cause);
    }
}
