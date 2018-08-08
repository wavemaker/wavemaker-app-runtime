package com.wavemaker.runtime.security;

import java.util.List;

import org.springframework.security.core.GrantedAuthority;

/**
 * Created by srujant on 8/8/18.
 */
public interface UserAuthoritiesProvider {

    List<GrantedAuthority> loadAuthorities(AuthenticationContext authenticationContext);
}
