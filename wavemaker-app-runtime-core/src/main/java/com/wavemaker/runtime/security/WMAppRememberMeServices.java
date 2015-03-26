package com.wavemaker.runtime.security;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.AuthenticationDetailsSource;
import org.springframework.security.authentication.RememberMeAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.RememberMeServices;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.web.authentication.logout.LogoutHandler;

/**
 * @author Uday Shankar
 */
public class WMAppRememberMeServices implements RememberMeServices,LogoutHandler {

    private WMCustomAuthenticationManager wmCustomAuthenticationManager;

    private String key;

    private AuthenticationDetailsSource<HttpServletRequest, ?> authenticationDetailsSource = new WebAuthenticationDetailsSource();

    public WMAppRememberMeServices() {
    }

    @Override
    public Authentication autoLogin(HttpServletRequest request, HttpServletResponse response) {
        WMUserDetails wmUserDetails = wmCustomAuthenticationManager.authenticate(request);
        if(wmUserDetails != null) {
            RememberMeAuthenticationToken authenticationToken = new RememberMeAuthenticationToken(key, wmUserDetails, wmUserDetails.getAuthorities());
            authenticationToken.setDetails(authenticationDetailsSource.buildDetails(request));
            return authenticationToken;
        }
        return null;
    }

    @Override
    public void loginFail(HttpServletRequest request, HttpServletResponse response) {
    }

    @Override
    public void loginSuccess(HttpServletRequest request, HttpServletResponse response, Authentication successfulAuthentication) {
    }

    public void setKey(String key) {
        this.key = key;
    }

    public void setWmCustomAuthenticationManager(WMCustomAuthenticationManager wmCustomAuthenticationManager) {
        this.wmCustomAuthenticationManager = wmCustomAuthenticationManager;
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
    }
}
