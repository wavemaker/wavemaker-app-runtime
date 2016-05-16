package com.wavemaker.runtime.security.provider.cas;

import org.springframework.security.core.userdetails.UserDetailsByNameServiceWrapper;
import org.springframework.security.core.userdetails.UserDetailsService;

/**
 * Created by ArjunSahasranam on 5/16/16.
 */
public class CASUserDetailsByNameServiceWrapper extends UserDetailsByNameServiceWrapper {

    public CASUserDetailsByNameServiceWrapper(UserDetailsService userDetailsService) {
        super(userDetailsService);
    }
}
