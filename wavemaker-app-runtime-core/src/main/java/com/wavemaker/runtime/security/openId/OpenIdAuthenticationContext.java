package com.wavemaker.runtime.security.openId;

import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import com.wavemaker.runtime.security.AuthenticationContext;

/**
 * Created by srujant on 8/8/18.
 */
public class OpenIdAuthenticationContext implements AuthenticationContext {
    private OidcUser oidcUser;
    private String username;

    public OpenIdAuthenticationContext(String username, OidcUser oidcUser) {
        this.oidcUser = oidcUser;
        this.username = username;
    }

    public OidcUser getOidcUser() {
        return oidcUser;
    }

    @Override
    public String getUsername() {
        return username;
    }
}
