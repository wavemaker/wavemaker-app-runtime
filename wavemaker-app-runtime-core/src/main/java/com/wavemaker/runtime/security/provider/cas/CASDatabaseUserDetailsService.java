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
package com.wavemaker.runtime.security.provider.cas;

import java.util.HashSet;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.wavemaker.runtime.security.WMUser;
import com.wavemaker.runtime.security.provider.database.authorities.AuthoritiesProvider;

/**
 * @author Arjun Sahasranam
 */
public class CASDatabaseUserDetailsService implements UserDetailsService {

    private AuthoritiesProvider authoritiesProvider;

    public CASDatabaseUserDetailsService() {
    }

    @Override
    public UserDetails loadUserByUsername(final String username) throws UsernameNotFoundException {
        Set<GrantedAuthority> dbAuthsSet = new HashSet<>();

        dbAuthsSet.addAll(authoritiesProvider.loadUserAuthorities(username));

        long loginTime = System.currentTimeMillis();
        return new WMUser("", username, "", username, 0, true, true, true, true, dbAuthsSet, loginTime);
    }


    public AuthoritiesProvider getAuthoritiesProvider() {
        return authoritiesProvider;
    }

    public void setAuthoritiesProvider(AuthoritiesProvider authoritiesProvider) {
        this.authoritiesProvider = authoritiesProvider;
    }
}
