package com.wavemaker.runtime.security.provider.saml;

import java.util.HashSet;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.saml.SAMLCredential;
import org.springframework.security.saml.userdetails.SAMLUserDetailsService;

import com.wavemaker.runtime.security.WMUser;
import com.wavemaker.runtime.security.provider.database.authorities.AuthoritiesProvider;

/**
 * @author Arjun Sahasranam
 */
public class WMSAMLDatabaseUserDetailsService implements SAMLUserDetailsService {

    private AuthoritiesProvider authoritiesProvider;

    public WMSAMLDatabaseUserDetailsService() {
    }

    @Override
    public Object loadUserBySAML(final SAMLCredential credential) throws UsernameNotFoundException {
        String username = credential.getNameID().getValue();
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
