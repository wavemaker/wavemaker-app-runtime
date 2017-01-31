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
package com.wavemaker.runtime.security.provider.database;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.wavemaker.runtime.security.provider.database.authorities.AuthoritiesProvider;
import com.wavemaker.runtime.security.provider.database.users.UserProvider;


/**
 * @author Arjun Sahasranam
 *
 *         Runs both native sql and hql queries.
 */
public class DatabaseUserDetailsService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseUserDetailsService.class);

    private boolean enableAuthorities = true;

    private UserProvider userProvider;
    private AuthoritiesProvider authoritiesProvider;

    public DatabaseUserDetailsService() {
    }

    @Override
    public UserDetails loadUserByUsername(final String username) throws UsernameNotFoundException {
        UserDetails user = userProvider.loadUser(username);

        if (user == null) {
            logger.debug("Query returned no results for user '" + username + "'");
            throw new UsernameNotFoundException("User " + username + "not found");
        }

        Set<GrantedAuthority> dbAuthsSet = new HashSet<>();

        if (enableAuthorities) {
            dbAuthsSet.addAll(authoritiesProvider.loadUserAuthorities(user.getUsername()));
            if (dbAuthsSet.size() == 0) {
                logger.debug("User '" + username + "' has no authorities and will be treated as 'not found'");
                throw new UsernameNotFoundException("User" + username + "has no GrantedAuthority");
            }
        }

        return userProvider.createUserDetails(username, user, new ArrayList<>(dbAuthsSet));

    }

    public UserProvider getUserProvider() {
        return userProvider;
    }

    public void setUserProvider(final UserProvider userProvider) {
        this.userProvider = userProvider;
    }

    public AuthoritiesProvider getAuthoritiesProvider() {
        return authoritiesProvider;
    }

    public void setAuthoritiesProvider(
            final AuthoritiesProvider authoritiesProvider) {
        this.authoritiesProvider = authoritiesProvider;
    }
}

