/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.core.authority.mapping.SimpleAuthorityMapper;
import org.springframework.security.core.userdetails.User;

/**
 * @author Seung Lee
 */
public class WMUser extends User implements WMUserDetails {

    private String userLongName;
    private int tenantId;
    private String userId;
    private long loginTime;
    private Map<String, Object> customAttributes;

    private static GrantedAuthoritiesMapper authoritiesMapper = new SimpleAuthorityMapper();

    public WMUser(String userName, Collection<String> roles) {
        this(userName, userName, "", userName, 0, roles);
    }

    /**
     * @deprecated  use WMUserBuilder to create this class objects
     */
    @Deprecated
    public WMUser(String userName, String password, Collection<String> roles) {
        this(userName, userName, password, userName, 0, roles);
    }

    /**
     * @deprecated  use WMUserBuilder to create this class objects
     */
    @Deprecated
    public WMUser(String userId, String username, String password, String userLongName, int tenantId, Collection<String> roles) {
        this(userId, username, password, userLongName, tenantId, true, true, true, true, getGrantedAuthorities(roles), System.currentTimeMillis());
    }

    /**
     * @deprecated  use WMUserBuilder to create this class objects
     */
    @Deprecated
    public WMUser(String userId, String username, String password, String userLongName, int tenantId, boolean enabled, boolean accountNonExpired,
                  boolean credentialsNonExpired, boolean accountNonLocked, Collection<? extends GrantedAuthority> authorities, long loggedInAt) {
        super(username, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authoritiesMapper.mapAuthorities(authorities));
        this.userId = userId;
        this.userLongName = userLongName;
        this.tenantId = tenantId;
        this.loginTime = loggedInAt;
        this.customAttributes = new HashMap<>();
    }

    static Collection<? extends GrantedAuthority> getGrantedAuthorities(Collection<String> roles) {
        Collection<GrantedAuthority> grantedAuthorities = new ArrayList();
        for (String role : roles) {
            grantedAuthorities.add(new SimpleGrantedAuthority(role));
        }
        return grantedAuthorities;
    }

    @Override
    public long getLoginTime() {
        return loginTime;
    }

    @Override
    public String getUserId() {
        return this.userId;
    }

    @Override
    public String getUserLongName() {
        return this.userLongName;
    }

    @Override
    public int getTenantId() {
        return this.tenantId;
    }

    @Override
    public Map<String, Object> getCustomAttributes() {
        return customAttributes;
    }

    public void setCustomAttributes(Map<String, Object> customAttributes) {
        this.customAttributes = customAttributes;
    }

    public void setUserLongName(String userLongName) {
        this.userLongName = userLongName;
    }

    public void setTenantId(int tenantId) {
        this.tenantId = tenantId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setLoginTime(long loginTime) {
        this.loginTime = loginTime;
    }

    public void addCustomAttribute(String name, Object value) {
        customAttributes.put(name, value);
    }
}
