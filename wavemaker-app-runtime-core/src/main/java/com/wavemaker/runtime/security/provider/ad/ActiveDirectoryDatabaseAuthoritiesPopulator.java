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
