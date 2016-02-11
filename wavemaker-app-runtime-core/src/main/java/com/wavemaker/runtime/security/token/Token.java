package com.wavemaker.runtime.security.token;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 *
 *
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 7/2/16
 */
public class Token implements Serializable{

    @JsonProperty("wm_auth_token")
    private String wmAuthToken;

    public Token(final String wmAuthToken) {
        this.wmAuthToken = wmAuthToken;
    }

    public String getWmAuthToken() {
        return wmAuthToken;
    }

    public void setWmAuthToken(final String wmAuthToken) {
        this.wmAuthToken = wmAuthToken;
    }
}
