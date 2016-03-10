package com.wavemaker.runtime.security.provider.database.users;

import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Created by ArjunSahasranam on 15/3/16.
 */
public interface UserProvider {
    UserDetails loadUser(String username);

    UserDetails createUserDetails(String username, UserDetails user, List<GrantedAuthority> dbAuths);
}
