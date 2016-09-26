package com.wavemaker.runtime.security.social;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.social.connect.Connection;
import org.springframework.social.connect.UserProfile;
import org.springframework.social.security.SocialAuthenticationToken;
import org.springframework.social.security.SocialUser;

/**
 * @author Uday Shankar
 */
public class DefaultOAuthUserDetailsProvider implements OAuthUserDetailsProvider {

    @Override
    public OAuthAuthenticationResponse getOAuthAuthenticationDetails(OAuthAuthenticationRequestContext oAuthAuthenticationRequestContext) {
        SocialAuthenticationToken socialAuthenticationToken = oAuthAuthenticationRequestContext.getSocialAuthenticationToken();
        Connection<?> connection = socialAuthenticationToken.getConnection();
        String username = getUsername(connection);
        SocialUser socialUser = new SocialUser(username, username, getGrantedAuthorities(connection));
        OAuthAuthenticationResponse oAuthAuthenticationResponse = new OAuthAuthenticationResponse();
        oAuthAuthenticationResponse.setSocialUser(socialUser);
        return oAuthAuthenticationResponse;
    }

    protected String getUsername(Connection<?> connection) {
        UserProfile userProfile = connection.fetchUserProfile();
        String username = userProfile.getName();
        username = (username == null) ? userProfile.getUsername(): username;
        return username;
    }

    protected List<GrantedAuthority> getGrantedAuthorities(Connection<?> connection) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("USER"));
        return authorities;
    }
}
