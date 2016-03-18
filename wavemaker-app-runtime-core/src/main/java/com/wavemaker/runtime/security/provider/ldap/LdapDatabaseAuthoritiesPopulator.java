package com.wavemaker.runtime.security.provider.ldap;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ldap.core.DirContextOperations;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.wavemaker.runtime.security.provider.database.authorities.AuthoritiesProvider;

/**
 * Created by ArjunSahasranam on 15/3/16.
 */
public class LdapDatabaseAuthoritiesPopulator implements org.springframework.security.ldap.userdetails.LdapAuthoritiesPopulator {
    private static final Logger logger = LoggerFactory.getLogger(LdapDatabaseAuthoritiesPopulator.class);

    private AuthoritiesProvider authoritiesProvider;

    @Override
    public Collection<? extends GrantedAuthority> getGrantedAuthorities(
            final DirContextOperations userData, final String username) {
        List<GrantedAuthority> dbAuthsSet = new ArrayList<>();
        dbAuthsSet.addAll(authoritiesProvider.loadUserAuthorities(username));
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
