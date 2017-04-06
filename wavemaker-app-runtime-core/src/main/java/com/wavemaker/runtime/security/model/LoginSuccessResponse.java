package com.wavemaker.runtime.security.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.wavemaker.runtime.security.csrf.SecurityConfigConstants;

/**
 * Created by kishore on 6/4/17.
 */
public class LoginSuccessResponse {

    @JsonProperty(SecurityConfigConstants.WM_CSRF_TOKEN_COOKIE)
    private String wmCsrfToken;

    public LoginSuccessResponse() {
    }

    public String getWmCsrfToken() {
        return wmCsrfToken;
    }

    public void setWmCsrfToken(String wmCsrfToken) {
        this.wmCsrfToken = wmCsrfToken;
    }
}
