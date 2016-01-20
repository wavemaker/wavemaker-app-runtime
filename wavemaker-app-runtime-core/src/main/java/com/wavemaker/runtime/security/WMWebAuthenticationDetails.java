package com.wavemaker.runtime.security;

import org.springframework.security.web.authentication.WebAuthenticationDetails;

import javax.servlet.http.HttpServletRequest;

/**
 * @author Uday Shankar
 */
public class WMWebAuthenticationDetails extends WebAuthenticationDetails {

    private HttpServletRequest httpServletRequest;

    public WMWebAuthenticationDetails(HttpServletRequest httpServletRequest) {
        super(httpServletRequest);
        this.httpServletRequest = httpServletRequest;
    }

    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }

    public void clearLoginRequestDetails() {
        this.httpServletRequest = null;
    }
}
