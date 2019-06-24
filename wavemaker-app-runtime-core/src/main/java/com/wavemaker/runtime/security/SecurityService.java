/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.wavemaker.commons.model.security.CSRFConfig;
import com.wavemaker.commons.model.security.LoginConfig;
import com.wavemaker.commons.model.security.RoleConfig;
import com.wavemaker.commons.model.security.RolesConfig;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.config.WMAppSecurityConfig;
import com.wavemaker.runtime.security.model.SecurityInfo;
import com.wavemaker.runtime.security.model.UserInfo;
import com.wavemaker.runtime.security.token.Token;
import com.wavemaker.runtime.security.token.WMTokenBasedAuthenticationService;

/**
 * The Security Service provides interfaces to access authentication and authorization information in the system.
 *
 * @author Frankie Fu
 */
@Service
public class SecurityService {

    private static final Logger logger = LoggerFactory.getLogger(SecurityService.class);

    private static final String ROLE_PREFIX = "ROLE_";

    private Boolean securityEnabled;

    private WMTokenBasedAuthenticationService wmTokenBasedAuthenticationService;

    @Autowired(required = false)
    private WMAppSecurityConfig wmAppSecurityConfig;

    public SecurityService() {
    }

    private static Authentication getAuthenticatedAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication instanceof AnonymousAuthenticationToken ? null : authentication;
    }

    /**
     * This method is deprecated. You can set custom attributes in successhandlers.
     */
    @Deprecated
    public static int getTenantId() {
        return 0;
    }


    /**
     * Checks whether the security is enabled or not. It returns true if it is enable, else, false.
     *
     * @return true if the security is enabled; otherwise, false.
     */
    public boolean isSecurityEnabled() {
        if (securityEnabled == null) {
            if (wmAppSecurityConfig != null) {
                securityEnabled = wmAppSecurityConfig.isEnforceSecurity();
            } else {
                securityEnabled = false;
            }
        }
        return securityEnabled;
    }

    private boolean isRememberMeEnabled() {
        if (wmAppSecurityConfig != null && wmAppSecurityConfig.getRememberMeConfig() != null) {
            return wmAppSecurityConfig.getRememberMeConfig().isEnabled();
        }
        return false;
    }

    public LoginConfig getLoginConfig() {
        return wmAppSecurityConfig.getLoginConfig();
    }

    private String getCsrfHeaderName() {
        if (isSecurityEnabled()) {
            CSRFConfig csrfConfig = WMAppContext.getInstance().getSpringBean(CSRFConfig.class);
            return csrfConfig.getHeaderName();
        }
        return null;
    }

    /**
     * Checks whether the user has been authenticated or not depending on authentication object.
     *
     * @return true if the user was authenticated; otherwise, false.
     */
    public boolean isAuthenticated() {
        return getAuthenticatedAuthentication() != null;
    }

    public Map<String, Object> getClientAttributes() {
        Authentication authentication = getAuthenticatedAuthentication();

        if (authentication != null) {
            WMAuthentication wmAuthentication = (WMAuthentication) authentication;
            Map<String, Object> customAttributes = new HashMap<>();
            Map<String, Attribute> attributeMap = wmAuthentication.getAttributes();
            attributeMap.entrySet().stream().forEach(entry -> {
                        Attribute attribute = entry.getValue();
                        if (attribute.getScope() != Attribute.AttributeScope.SERVER_ONLY) {
                            customAttributes.put(entry.getKey(), attribute.getValue());
                        }
                    }
            );
            return customAttributes;
        }
        return null;
    }

    public Map<String, Object> getAllAttributes() {
        Authentication authentication = getAuthenticatedAuthentication();

        if (authentication != null) {
            WMAuthentication wmAuthentication = (WMAuthentication) authentication;
            Map<String, Object> customAttributes = new HashMap<>();
            Map<String, Attribute> attributeMap = wmAuthentication.getAttributes();
            attributeMap.entrySet().stream().forEach(entry -> {
                        Attribute attribute = entry.getValue();
                        customAttributes.put(entry.getKey(), attribute.getValue());
                    }
            );
            return customAttributes;
        }
        return null;
    }

    /**
     * Get Current LoggedIn User.
     * If security is enabled and user is authenticated then other fields like userId,
     * userName, tenantId, userRoles etc are also set, otherwise, only securityEnabled value is set.
     *
     * @return WMCurrentUser type.
     */
    public WMCurrentUser getLoggedInUser() {
        WMCurrentUser wmCurrentUser = new WMCurrentUser();
        Boolean securityEnabled = isSecurityEnabled();
        boolean authenticated = isAuthenticated();
        wmCurrentUser.setSecurityEnabled(securityEnabled);
        wmCurrentUser.setAuthenticated(authenticated);
        if (securityEnabled && authenticated) {
            wmCurrentUser.setUserId(getUserId());
            wmCurrentUser.setUserName(getUserName());
            wmCurrentUser.setUserRoles(getUserRoles());
            wmCurrentUser.setLoginTime(getLoginTime());
        }
        return wmCurrentUser;
    }

    /**
     * Returns the user name of the principal in the current security context.
     * If the {@link org.springframework.security.core.userdetails.UserDetails} obtained from authentication is an instance of {@link WMUserDetails},then user's long name is returned from WMUserDetails,
     * else returns the username from authentication Object.
     * Second case happens when services like ldap are used to authenticate
     *
     * @return The user name.
     */
    public String getUserName() {
        final Authentication authentication = getAuthenticatedAuthentication();
        if (authentication != null) {
            return authentication.getName();
        }
        return null;
    }

    /**
     * Returns the user id of the principal in the current security context, otherwise, it returns name of the authenticated user..
     *
     * @return String value, which will contain userId.
     */
    public String getUserId() {
        final Authentication authentication = getAuthenticatedAuthentication();
        if (authentication != null) {
            return ((WMAuthentication) authentication).getUserId();
        }
        return null;
    }

    /**
     * If authentication is null then it returns empty String array. If not then it will retrieve the authority and process the roleName in the spring format before returning and then return.
     *
     * @return String array with roles or empty depending on authentication object.
     */
    public String[] getUserRoles() {
        Authentication authentication = getAuthenticatedAuthentication();
        if (authentication == null) {
            return new String[0];
        }
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        List<String> roleNames = new ArrayList<>();
        for (GrantedAuthority authority : authorities) {
            String roleName = authority.getAuthority();
            String realRoleName = null;
            if (roleName.startsWith(ROLE_PREFIX)) {
                // take out the prefix and get the actual role name
                realRoleName = roleName.substring(ROLE_PREFIX.length());
            } else {
                logger.warn("Role {} does not use the prefix {}. This may cause problems", roleName, ROLE_PREFIX);
                realRoleName = roleName;
            }

            // make sure the role is not the maker for no roles
            if (realRoleName != null) {
                roleNames.add(realRoleName);
            }
        }

        return roleNames.toArray(new String[0]);
    }

    /**
     * If authentication is null then it returns empty String array. If not then it will retrieve the authority and process the roleName in the spring format before returning and then return.
     *
     * @return String array with roles or empty depending on authentication object.
     */
    public String getUserLandingPage() {
        String landingPage = null;

        String[] userRoles = getUserRoles();
        if (userRoles.length > 0) {
            RolesConfig rolesConfig = wmAppSecurityConfig.getRolesConfig();
            if (rolesConfig != null) {
                Map<String, RoleConfig> roleMap = rolesConfig.getRoleMap();

                if (userRoles.length == 1) {
                    final RoleConfig roleConfig = roleMap.get(userRoles[0]);
                    if (roleConfig != null) {
                        landingPage = roleConfig.getLandingPage();
                    }
                } else {
                    Iterator<Map.Entry<String, RoleConfig>> roleEntryIterator = roleMap.entrySet().iterator();
                    while (roleEntryIterator.hasNext() && landingPage == null) {
                        Map.Entry<String, RoleConfig> roleEntry = roleEntryIterator.next();
                        for (String userRole : userRoles) {
                            if (userRole.equals(roleEntry.getKey())) {
                                landingPage = roleEntry.getValue().getLandingPage();
                                break;
                            }
                        }
                    }
                }
            }
        }
        return landingPage;
    }

    /**
     * It returns Login Time of the current user when userDetail object in current security context is not null, otherwise, it returns 0.
     *
     * @return login tine in milliseconds (long value).
     */
    public long getLoginTime() {
        final Authentication authentication = getAuthenticatedAuthentication();
        if (authentication != null) {
            return ((WMAuthentication) authentication).getLoginTime();
        }
        return 0L;
    }

    public List<String> getRoles() {
        RolesConfig rolesConfig = wmAppSecurityConfig.getRolesConfig();
        return (rolesConfig == null) ? Collections.emptyList() : new ArrayList<>(rolesConfig.getRoleMap().keySet());
    }

    public SecurityInfo getSecurityInfo() {
        final boolean authenticated = isAuthenticated();
        UserInfo userInfo = null;
        if (authenticated) {
            userInfo = new UserInfo();
            userInfo.setUserId(getUserId());
            userInfo.setUserName(getUserName());
            userInfo.setUserRoles(getUserRoles());
            userInfo.setLandingPage(getUserLandingPage());
            userInfo.setUserAttributes(getClientAttributes());
        }

        SecurityInfo securityInfo = new SecurityInfo();
        securityInfo.setAuthenticated(authenticated);
        securityInfo.setSecurityEnabled(isSecurityEnabled());
        securityInfo.setRememberMeEnabled(isRememberMeEnabled());
        securityInfo.setLoginConfig(getLoginConfig());
        securityInfo.setUserInfo(userInfo);
        securityInfo.setCsrfHeaderName(getCsrfHeaderName());
        return securityInfo;
    }

    public Token generateUserAccessToken() {
        Authentication authentication = getAuthenticatedAuthentication();
        if (authentication != null) {
            return getWmTokenBasedAuthenticationService().generateToken(authentication);
        }
        throw new AuthenticationCredentialsNotFoundException("Require authentication to generate access token");
    }


    public WMTokenBasedAuthenticationService getWmTokenBasedAuthenticationService() {
        if (wmTokenBasedAuthenticationService == null) {
            try {
                wmTokenBasedAuthenticationService = WMAppContext.getInstance().getSpringBean(WMTokenBasedAuthenticationService.class);
            } catch (NoSuchBeanDefinitionException e) {
                throw new AuthenticationServiceException("Security is not enabled");
            }
        }
        return wmTokenBasedAuthenticationService;
    }

    public void ssoLogin() {
        //DUMMY METHOD to redirect to default sso entry point...
        //When this method is invoked, the sso Filter is intercepted and sends the user to the default sso Login page through its AuthenticationEntryPoint.
    }
}
