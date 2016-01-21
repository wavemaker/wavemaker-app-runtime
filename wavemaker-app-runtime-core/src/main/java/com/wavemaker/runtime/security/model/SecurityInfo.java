package com.wavemaker.runtime.security.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.wavemaker.studio.common.model.security.LoginConfig;

/**
 * Created by ArjunSahasranam on 14/1/16.
 */
public class SecurityInfo {
    private boolean securityEnabled;
    private boolean authenticated;
    private LoginConfig loginConfig;
    private UserInfo userInfo;

    public boolean isSecurityEnabled() {
        return securityEnabled;
    }

    public void setSecurityEnabled(final boolean securityEnabled) {
        this.securityEnabled = securityEnabled;
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(final boolean authenticated) {
        this.authenticated = authenticated;
    }

    @JsonProperty("login")
    public LoginConfig getLoginConfig() {
        return loginConfig;
    }

    public void setLoginConfig(final LoginConfig loginConfig) {
        this.loginConfig = loginConfig;
    }

    public UserInfo getUserInfo() {
        return userInfo;
    }

    public void setUserInfo(final UserInfo userInfo) {
        this.userInfo = userInfo;
    }

    @Override
    public String toString() {
        return "SecurityInfo{" +
                "securityEnabled=" + securityEnabled +
                ", authenticated=" + authenticated +
                ", login=" + loginConfig +
                ", userInfo=" + userInfo +
                '}';
    }
}
