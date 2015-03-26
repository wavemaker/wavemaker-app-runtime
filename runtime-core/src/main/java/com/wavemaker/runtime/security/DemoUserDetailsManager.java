package com.wavemaker.runtime.security;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Properties;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

/**
 * Created by nileshk on 16/12/14.
 */
public class DemoUserDetailsManager extends InMemoryUserDetailsManager {

    public DemoUserDetailsManager() {
        super(Collections.EMPTY_LIST);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDetails userDetails = super.loadUserByUsername(username);
        return new WMUser(userDetails.getUsername(), userDetails.getUsername(), userDetails.getPassword(), userDetails.getUsername(), 1, true, true, true,
                true, userDetails.getAuthorities(), System.currentTimeMillis());
    }

    public void setUsers(List<WMUser> users) {
        for (WMUser user : users) {
            createUser(user);
        }
    }
}
