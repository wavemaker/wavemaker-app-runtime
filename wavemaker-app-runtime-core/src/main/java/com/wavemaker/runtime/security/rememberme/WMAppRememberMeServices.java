package com.wavemaker.runtime.security.rememberme;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;

import com.wavemaker.runtime.security.config.WMAppSecurityConfig;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 22/1/16
 */
public class WMAppRememberMeServices extends TokenBasedRememberMeServices {

    public static final String REMEMBER_ME_PARAMETER = "remember-me";

    @Autowired
    private WMAppSecurityConfig securityConfig;

    public WMAppRememberMeServices(final String key, final UserDetailsService userDetailsService) {
        super(key, userDetailsService);
    }

    @Override
    protected String extractRememberMeCookie(HttpServletRequest request) {
        if (rememberMeEnabled()) {
            return super.extractRememberMeCookie(request);
        }
        return null;
    }

    @Override
    public void onLoginSuccess(HttpServletRequest request, HttpServletResponse response,
                               Authentication successfulAuthentication) {
        if (rememberMeEnabled()) {
            super.onLoginSuccess(request, response, successfulAuthentication);
        }
    }

    public String getParameter() {
        return REMEMBER_ME_PARAMETER;
    }

    private boolean rememberMeEnabled() {
        return securityConfig.getRememberMeConfig() != null && securityConfig.getRememberMeConfig().isEnabled();
    }

}
