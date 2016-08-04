package com.wavemaker.runtime.security.csrf;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;

import com.wavemaker.runtime.security.AbstractLogoutHandler;

/**
 * Created by kishorer on 13/7/16.
 */
public class WMCsrfLogoutHandler extends AbstractLogoutHandler {

    public WMCsrfLogoutHandler(LogoutHandler logoutHandler) {
        super(logoutHandler);
    }

    @Override
    protected void postLogout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        Cookie cookie = new Cookie(SecurityConfigConstants.WM_CSRF_TOKEN_COOKIE, null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
    }
}
