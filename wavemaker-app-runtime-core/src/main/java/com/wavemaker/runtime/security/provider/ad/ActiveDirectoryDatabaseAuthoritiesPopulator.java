/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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
package com.wavemaker.runtime.security.provider.ad;

import java.util.Collection;

import org.springframework.ldap.core.DirContextOperations;
import org.springframework.security.core.GrantedAuthority;

import com.wavemaker.runtime.security.provider.database.authorities.AuthoritiesProvider;

/**
 * Created by ArjunSahasranam on 22/3/16.
 */
public class ActiveDirectoryDatabaseAuthoritiesPopulator implements ActiveDirectoryAuthoritiesPopulator {
    private AuthoritiesProvider authoritiesProvider;

    @Override
    public Collection<? extends GrantedAuthority> getGrantedAuthorities(
            final DirContextOperations userData, final String username) {
        return authoritiesProvider.loadUserAuthorities(username);
    }

    public AuthoritiesProvider getAuthoritiesProvider() {
        return authoritiesProvider;
    }

    public void setAuthoritiesProvider(
            final AuthoritiesProvider authoritiesProvider) {
        this.authoritiesProvider = authoritiesProvider;
    }
}
