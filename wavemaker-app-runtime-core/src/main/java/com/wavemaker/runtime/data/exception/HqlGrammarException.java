package com.wavemaker.runtime.data.exception;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;

/**
 * @author Sujith Simon
 * Created on : 1/11/18
 */
public class HqlGrammarException extends WMRuntimeException {

    public HqlGrammarException(MessageResource resource, Object... args) {
        super(resource, args);
    }
}
