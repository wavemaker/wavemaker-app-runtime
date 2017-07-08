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
package com.wavemaker.runtime.security.social;

import java.util.ArrayList;
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
