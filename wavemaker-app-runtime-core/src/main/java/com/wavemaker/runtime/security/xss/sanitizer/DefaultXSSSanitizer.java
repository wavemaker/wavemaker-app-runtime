package com.wavemaker.runtime.security.xss.sanitizer;

/**
 * Created by kishorer on 6/7/16.
 */
public class DefaultXSSSanitizer implements XSSSanitizer {

    @Override
    public String sanitizeRequestData(String data) {
        return data;
    }
}
