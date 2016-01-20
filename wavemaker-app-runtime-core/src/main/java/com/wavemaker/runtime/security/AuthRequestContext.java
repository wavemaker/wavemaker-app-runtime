package com.wavemaker.runtime.security;

import javax.servlet.http.HttpServletRequest;
import java.io.Serializable;

/**
 * @author Uday Shankar
 */
public class AuthRequestContext implements Serializable {

    private String username;

    private String password;

    private HttpServletRequest httpServletRequest;

    public AuthRequestContext(HttpServletRequest httpServletRequest) {
        this(null, null, httpServletRequest);
    }

    public AuthRequestContext(String username, String password, HttpServletRequest httpServletRequest) {
        this.username = username;
        this.password = password;
        this.httpServletRequest = httpServletRequest;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }
}
