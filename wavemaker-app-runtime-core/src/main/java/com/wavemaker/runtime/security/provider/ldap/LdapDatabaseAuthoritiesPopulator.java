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
package com.wavemaker.runtime.security.provider.ldap;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.ldap.core.DirContextOperations;
import org.springframework.security.core.GrantedAuthority;

import com.wavemaker.runtime.security.core.AuthoritiesProvider;
import com.wavemaker.runtime.security.core.DefaultAuthenticationContext;

/**
 * Created by ArjunSahasranam on 15/3/16.
 */
public class LdapDatabaseAuthoritiesPopulator implements
        org.springframework.security.ldap.userdetails.LdapAuthoritiesPopulator {

    private AuthoritiesProvider authoritiesProvider;

    @Override
    public Collection<? extends GrantedAuthority> getGrantedAuthorities(
            final DirContextOperations userData, final String username) {
        List<GrantedAuthority> dbAuthsSet = new ArrayList<>();
        dbAuthsSet.addAll(authoritiesProvider.loadAuthorities(new DefaultAuthenticationContext(username)));
        return dbAuthsSet;
    }

    public AuthoritiesProvider getAuthoritiesProvider() {
        return authoritiesProvider;
    }

    public void setAuthoritiesProvider(
            final AuthoritiesProvider authoritiesProvider) {
        this.authoritiesProvider = authoritiesProvider;
    }
}
