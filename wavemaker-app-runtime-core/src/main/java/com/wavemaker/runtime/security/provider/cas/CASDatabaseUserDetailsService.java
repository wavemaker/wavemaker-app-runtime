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
