package com.wavemaker.runtime.security;

import org.springframework.security.authentication.AuthenticationDetailsSource;

import javax.servlet.http.HttpServletRequest;

/**
 * @author Uday Shankar
 */
public class WMWebAuthenticationDetailsSource implements AuthenticationDetailsSource<HttpServletRequest, WMWebAuthenticationDetails> {

    @Override
    public WMWebAuthenticationDetails buildDetails(HttpServletRequest context) {
        return new WMWebAuthenticationDetails(context);
    }
}
