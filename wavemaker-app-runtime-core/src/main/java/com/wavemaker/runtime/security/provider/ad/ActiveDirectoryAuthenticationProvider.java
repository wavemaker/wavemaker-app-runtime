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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ldap.core.DirContextOperations;
import org.springframework.security.core.GrantedAuthority;

import com.wavemaker.runtime.security.ad.SpringActiveDirectoryLdapAuthenticationProvider;

/**
 * @author Arjun Sahasranam
 */
public class ActiveDirectoryAuthenticationProvider extends SpringActiveDirectoryLdapAuthenticationProvider {


    private ActiveDirectoryAuthoritiesPopulator authoritiesPopulator;

    /**
     * @param domain the domain name (may be null or empty)
     * @param url    an LDAP url (or multiple URLs)
     */
    public ActiveDirectoryAuthenticationProvider(String domain, String url) {
        this(domain, url, null);
    }

    /**
     * @param domain the domain name (may be null or empty)
     * @param url    an LDAP url (or multiple URLs)
     * @param rootDn rootDn to override the computed rootDn in super class.
     */
    public ActiveDirectoryAuthenticationProvider(String domain, String url, String rootDn) {
        super(domain, url, rootDn);
        setConvertSubErrorCodesToExceptions(true);
    }

    /**
     * Creates the user authority list from the values of the {@code memberOf} attribute obtained from the user's
     * Active Directory entry.
     */
    @Override
    protected Collection<? extends GrantedAuthority> loadUserAuthorities(DirContextOperations userData, String username, String password) {
        return authoritiesPopulator.getGrantedAuthorities(userData, username);
    }

    public ActiveDirectoryAuthoritiesPopulator getAuthoritiesPopulator() {
        return authoritiesPopulator;
    }

    public void setAuthoritiesPopulator(ActiveDirectoryAuthoritiesPopulator authoritiesPopulator) {
        this.authoritiesPopulator = authoritiesPopulator;
    }
}
