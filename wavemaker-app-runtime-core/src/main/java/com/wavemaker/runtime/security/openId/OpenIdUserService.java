package com.wavemaker.runtime.security.openId;

import com.wavemaker.runtime.security.core.AuthoritiesProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUserAuthority;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

/**
 * Created by srujant on 8/8/18.
 */
public class OpenIdUserService extends OidcUserService {

    @Autowired(required = false)
    private AuthoritiesProvider authoritiesProvider;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        if (authoritiesProvider != null) {
            OpenIdAuthenticationContext openIdAuthenticationContext = new OpenIdAuthenticationContext(oidcUser.getName(), oidcUser);
            List<GrantedAuthority> grantedAuthorities = authoritiesProvider.loadAuthorities(openIdAuthenticationContext);
            if (!CollectionUtils.isEmpty(grantedAuthorities)) {
                List<GrantedAuthority> updatedGrantedAuthorities = new ArrayList();
                for (GrantedAuthority grantedAuthority : grantedAuthorities) {
                    updatedGrantedAuthorities.add(new OidcUserAuthority(grantedAuthority.getAuthority(), oidcUser.getIdToken(), oidcUser.getUserInfo()));
                }
                String userNameAttributeName = userRequest.getClientRegistration()
                        .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();
                if (org.springframework.util.StringUtils.hasText(userNameAttributeName)) {
                    oidcUser = new DefaultOidcUser(new HashSet<>(updatedGrantedAuthorities), oidcUser.getIdToken(), oidcUser.getUserInfo(), userNameAttributeName);
                } else {
                    oidcUser = new DefaultOidcUser(new HashSet<>(updatedGrantedAuthorities), userRequest.getIdToken(), oidcUser.getUserInfo());
                }
            }
        }
        return oidcUser;
    }

}
