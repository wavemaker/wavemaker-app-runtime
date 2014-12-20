/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
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

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

/**
 *
 * @author Seung Lee
 */
public class WMUser extends User implements WMUserDetails {

    private final String userLongName;
    private final int tenantId;
    private final String userId;
    private final long loginTime;

    public WMUser(String userId, String userName, Collection<String> roles) {
        this(userId, userName, userName, userName, 0, roles);
    }

    public WMUser(String userId, String username, String password, String userLongName, int tenantId, Collection<String> roles) {
        super(username, password, true, true, true, true, getGrantedAuthorities(roles));
        this.userId = userId;
        this.userLongName = userLongName;
        this.tenantId = tenantId;
        this.loginTime = System.currentTimeMillis();
    }

    public WMUser(String userId, String username, String password, String userLongName, int tenantId, boolean enabled, boolean accountNonExpired,
                  boolean credentialsNonExpired, boolean accountNonLocked, Collection<? extends GrantedAuthority> authorities, long loggedInAt) {
        super(username, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authorities);
        this.userId = userId;
        this.userLongName = userLongName;
        this.tenantId = tenantId;
        this.loginTime = loggedInAt;
    }

    private static Collection<? extends  GrantedAuthority> getGrantedAuthorities(Collection<String> roles) {
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
}
