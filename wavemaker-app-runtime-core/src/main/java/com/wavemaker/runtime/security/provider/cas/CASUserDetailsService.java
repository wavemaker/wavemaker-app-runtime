package com.wavemaker.runtime.security.provider.cas;

import com.wavemaker.runtime.security.WMUser;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/**
 * Created by ArjunSahasranam on 5/16/16.
 */
public class CASUserDetailsService implements UserDetailsService {
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        long loginTime = System.currentTimeMillis();
        return new WMUser("", username, "", username, 0, true, true, true, true, AuthorityUtils.NO_AUTHORITIES, loginTime);
    }
}
