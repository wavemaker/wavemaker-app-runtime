package com.wavemaker.runtime.security.core;

/**
 * @author Uday Shankar
 */
public class DefaultAuthenticationContext implements AuthenticationContext {
    
    private String username;

    public DefaultAuthenticationContext(String username) {
        this.username = username;
    }

    @Override
    public String getUsername() {
        return username;
    }
}
