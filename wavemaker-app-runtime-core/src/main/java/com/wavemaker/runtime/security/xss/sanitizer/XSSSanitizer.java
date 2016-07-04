package com.wavemaker.runtime.security.xss.sanitizer;

/**
 * Created by kishorer on 6/7/16.
 */
public interface XSSSanitizer {

    String sanitizeRequestData(String data);
}
