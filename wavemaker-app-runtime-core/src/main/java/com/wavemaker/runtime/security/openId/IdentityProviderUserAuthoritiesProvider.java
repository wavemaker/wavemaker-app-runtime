package com.wavemaker.runtime.security.openId;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.StringTokenizer;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.core.authority.mapping.SimpleAuthorityMapper;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import com.wavemaker.runtime.security.core.AuthenticationContext;
import com.wavemaker.runtime.security.core.AuthoritiesProvider;

/**
 * Created by srujant on 8/8/18.
 */
public class IdentityProviderUserAuthoritiesProvider implements AuthoritiesProvider {

    private static final Logger logger = LoggerFactory.getLogger(IdentityProviderUserAuthoritiesProvider.class);
    private String roleAttributeName;

    private static GrantedAuthoritiesMapper authoritiesMapper = new SimpleAuthorityMapper();

    @Override
    public List<GrantedAuthority> loadAuthorities(AuthenticationContext authenticationContext) {
        logger.debug("In the loadAuthorities method to set the roles and permissions");
        OpenIdAuthenticationContext openIdAuthenticationContext = (OpenIdAuthenticationContext) authenticationContext;
        OidcUser oidcUser = openIdAuthenticationContext.getOidcUser();

        if (StringUtils.isNotBlank(roleAttributeName)) {
            Map<String, Object> claims = oidcUser.getClaims();
            Object roles = claims.get(roleAttributeName);
            logger.debug("RoleAttributeName is {} with the roles as {}", roleAttributeName, roles);
            if (roles != null) {
                String[] rolesArray = null;
                if (roles instanceof String) {
                    List<String> rolesList = getRolesList((String) roles);
                    rolesArray = convertListToArray(rolesList);
                } else if (roles instanceof String[]) {
                    rolesArray = (String[]) roles;
                } else if (roles instanceof List) {
                    List rolesList = (List) roles;
                    rolesArray = convertListToArray(rolesList);
                } else {
                    String rolesList = roles.toString();
                    rolesArray = rolesList.split(",");
                }
                logger.debug("Roles {} are assigned", rolesArray);
                List<GrantedAuthority> authorities =  AuthorityUtils.createAuthorityList(rolesArray);
                authorities = new ArrayList(authoritiesMapper.mapAuthorities(authorities));
                return authorities;
            }
        }
        return null;
    }

    public String getRoleAttributeName() {
        return roleAttributeName;
    }

    public void setRoleAttributeName(String roleAttributeName) {
        this.roleAttributeName = roleAttributeName;
    }

    private String[] convertListToArray(List<String> rolesList) {
        return rolesList.toArray(new String[0]);
    }

    private List<String> getRolesList(String roles) {
        StringTokenizer roleTokenizer = new StringTokenizer(roles, ",");
        List<String> rolesList = new ArrayList<>();
        while (roleTokenizer.hasMoreTokens()) {
            String role = roleTokenizer.nextToken();
            rolesList.add(role);
        }
        return rolesList;
    }
}
