package com.wavemaker.runtime.security;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;

/**
 * Created by srujant on 13/8/18.
 */
public class WMUserBuilder {

    private WMUser wmUser;

    public static WMUserBuilder create(String userName, List<String> roles) {
        WMUserBuilder wmUserBuilder = new WMUserBuilder();
        wmUserBuilder.wmUser = new WMUser(userName, roles);
        return wmUserBuilder;
    }

    public static WMUserBuilder create(String userName, Collection<? extends GrantedAuthority> authorities) {
        WMUserBuilder wmUserBuilder = new WMUserBuilder();
        wmUserBuilder.wmUser = new WMUser(userName, AuthorityUtils.authorityListToSet(authorities));
        return wmUserBuilder;
    }

    public WMUserBuilder setCustomAttributes(Map<String, Object> customAttributes) {
        wmUser.setCustomAttributes(customAttributes);
        return this;
    }

    public WMUserBuilder setUserLongName(String userLongName) {
        wmUser.setUserLongName(userLongName);
        return this;
    }

    public WMUserBuilder setTenantId(int tenantId) {
        wmUser.setTenantId(tenantId);
        return this;
    }

    public WMUserBuilder setUserId(String userId) {
        wmUser.setUserId(userId);
        return this;
    }

    public WMUserBuilder setLoginTime(long loginTime) {
        wmUser.setLoginTime(loginTime);
        return this;
    }

    public WMUser build() {
        return wmUser;
    }

}