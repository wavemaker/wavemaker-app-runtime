package com.wavemaker.runtime.security.provider.cas;

import java.util.Map;
import java.util.StringTokenizer;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.cas.authentication.CasAssertionAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsByNameServiceWrapper;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.wavemaker.runtime.security.WMUser;

/**
 * Created by ArjunSahasranam on 5/16/16.
 */
public class CASUserDetailsByNameServiceWrapper extends UserDetailsByNameServiceWrapper {

    public CASUserDetailsByNameServiceWrapper(UserDetailsService userDetailsService) {
        super(userDetailsService);
    }

    private String roleAttributeName;

    @Override
    public UserDetails loadUserDetails(Authentication authentication) throws UsernameNotFoundException {
        if (StringUtils.isNotBlank(roleAttributeName)) {
            CasAssertionAuthenticationToken casAssertionAuthenticationToken = null;
            if (authentication instanceof CasAssertionAuthenticationToken) {
                casAssertionAuthenticationToken = (CasAssertionAuthenticationToken) authentication;
            }

            String roles = null;
            if (casAssertionAuthenticationToken != null) {
                Map attributes = casAssertionAuthenticationToken.getAssertion().getPrincipal().getAttributes();
                roles = (String) attributes.get(getRoleAttributeName());
            }

            StringTokenizer roleTokenizer = new StringTokenizer(roles, ",");

            WMUser userDetails = (WMUser) super.loadUserDetails(authentication);
            while (roleTokenizer.hasMoreTokens()) {
                String role = roleTokenizer.nextToken();
                GrantedAuthority simpleGrantedAuthority = new SimpleGrantedAuthority(role);
                userDetails.getAuthorities().add(simpleGrantedAuthority);
            }
            return userDetails;
        } else return super.loadUserDetails(authentication);
    }

    public String getRoleAttributeName() {
        return roleAttributeName;
    }

    public void setRoleAttributeName(final String roleAttributeName) {
        this.roleAttributeName = roleAttributeName;
    }
}
