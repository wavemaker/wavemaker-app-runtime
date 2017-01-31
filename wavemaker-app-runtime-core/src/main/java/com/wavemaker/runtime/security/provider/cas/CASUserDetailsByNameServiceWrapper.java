/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.security.provider.cas;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.StringTokenizer;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.cas.authentication.CasAssertionAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.AuthenticationUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.wavemaker.runtime.security.WMUser;

/**
 * Created by ArjunSahasranam on 5/16/16.
 */
public class CASUserDetailsByNameServiceWrapper implements AuthenticationUserDetailsService<Authentication> {

    private UserDetailsService userDetailsService;

    public CASUserDetailsByNameServiceWrapper(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
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
            List<String> rolesList = new ArrayList<>();
            while (roleTokenizer.hasMoreTokens()) {
                String role = roleTokenizer.nextToken();
                rolesList.add(role);
            }

            String[] rolesArray = new String[rolesList.size()];

            WMUser userDetails = (WMUser) userDetailsService.loadUserByUsername(authentication.getName());

            String username = userDetails.getUsername();
            String userId = userDetails.getUserId();
            String password = userDetails.getPassword();
            long loginTime = System.currentTimeMillis();
            return new WMUser(userId, username, password, username, 0, true, true, true, true, AuthorityUtils.createAuthorityList(rolesList.toArray(rolesArray)),
                    loginTime);
        } else return userDetailsService.loadUserByUsername(authentication.getName());
    }

    public String getRoleAttributeName() {
        return roleAttributeName;
    }

    public void setRoleAttributeName(final String roleAttributeName) {
        this.roleAttributeName = roleAttributeName;
    }


}
