package com.wavemaker.runtime.security;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;

/**
 * Created by kishorer on 13/7/16.
 */
public abstract class AbstractLogoutHandler implements LogoutHandler {

    private LogoutHandler delegator;

    protected AbstractLogoutHandler(LogoutHandler logoutHandler) {
        this.delegator = logoutHandler;
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        delegator.logout(request, response, authentication);
        postLogout(request, response, authentication);
    }

    protected abstract void postLogout(HttpServletRequest request, HttpServletResponse response, Authentication authentication);
}
