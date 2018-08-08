package com.wavemaker.runtime.security.openId;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.StringTokenizer;

import org.apache.commons.lang.StringUtils;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import com.wavemaker.runtime.security.AuthenticationContext;
import com.wavemaker.runtime.security.UserAuthoritiesProvider;

/**
 * Created by srujant on 8/8/18.
 */
public class IdentityProviderUserAuthoritiesProvider implements UserAuthoritiesProvider {

    private String roleAttributeName;

    @Override
    public List<GrantedAuthority> loadAuthorities(AuthenticationContext authenticationContext) {
        OpenIdAuthenticationContext openIdAuthenticationContext = (OpenIdAuthenticationContext) authenticationContext;
        OidcUser oidcUser = openIdAuthenticationContext.getOidcUser();

        if (StringUtils.isNotBlank(roleAttributeName)) {
            Map<String, Object> claims = oidcUser.getClaims();
            Object roles = claims.get(roleAttributeName);
            if (roles != null) {
                String[] rolesArray = null;
                if (roles instanceof String) {
                    List<String> rolesList = getRolesList((String) roles);
                    rolesArray = new String[rolesList.size()];
                } else if (roles instanceof String[]) {
                    rolesArray = (String[]) roles;
                }
                return AuthorityUtils.createAuthorityList(rolesArray);
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
