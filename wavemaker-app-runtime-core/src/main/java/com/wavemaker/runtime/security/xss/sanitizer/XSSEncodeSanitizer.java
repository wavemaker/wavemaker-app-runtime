package com.wavemaker.runtime.security.xss.sanitizer;

import org.apache.commons.lang3.StringEscapeUtils;

/**
 * Created by kishorer on 6/7/16.
 */
public class XSSEncodeSanitizer implements XSSSanitizer {

    @Override
    public String sanitizeRequestData(final String data) {
        if (data == null) {
            return data;
        }
        return StringEscapeUtils.escapeHtml4(data);
    }
}
