package com.wavemaker.runtime.security.provider.database.authorities;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;

/**
 * Created by ArjunSahasranam on 15/3/16.
 */
public interface AuthoritiesProvider {

    Collection<? extends GrantedAuthority> loadUserAuthorities(String username);

}

