package com.wavemaker.runtime.security.provider.ad;

import java.util.Collection;

import org.springframework.ldap.core.DirContextOperations;
import org.springframework.security.core.GrantedAuthority;

/**
 * Created by ArjunSahasranam on 22/3/16.
 */
public interface ActiveDirectoryAuthoritiesPopulator {

    Collection<? extends GrantedAuthority> getGrantedAuthorities(DirContextOperations userData, String username);
}
