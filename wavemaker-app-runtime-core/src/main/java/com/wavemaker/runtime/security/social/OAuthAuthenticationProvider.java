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
package com.wavemaker.runtime.security.social;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.social.security.SocialAuthenticationToken;
import org.springframework.social.security.SocialUser;
import org.springframework.util.Assert;

/**
 * @author Uday Shankar
 */
public class OAuthAuthenticationProvider implements AuthenticationProvider {

    private OAuthUserDetailsProvider oAuthUserDetailsProvider;

    public OAuthAuthenticationProvider(OAuthUserDetailsProvider oAuthUserDetailsProvider) {
        this.oAuthUserDetailsProvider = oAuthUserDetailsProvider;
    }

    @Override
    public Authentication authenticate(Authentication authentication) {
        Assert.isInstanceOf(SocialAuthenticationToken.class, authentication, "unsupported authentication type");
        Assert.isTrue(!authentication.isAuthenticated(), "already authenticated");
        SocialAuthenticationToken socialAuthenticationToken = (SocialAuthenticationToken) authentication;

        OAuthAuthenticationRequestContext oAuthAuthenticationRequestContext = new OAuthAuthenticationRequestContext();
        oAuthAuthenticationRequestContext.setSocialAuthenticationToken(socialAuthenticationToken);
        OAuthAuthenticationResponse oAuthAuthenticationResponse = oAuthUserDetailsProvider
                .getOAuthAuthenticationDetails(oAuthAuthenticationRequestContext);

        if (oAuthAuthenticationResponse == null) {
            throw new UsernameNotFoundException("Not a valid user");
        }
        SocialUser socialUser = oAuthAuthenticationResponse.getSocialUser();
        return new SocialAuthenticationToken(socialAuthenticationToken.getConnection(), socialUser,
                socialAuthenticationToken.getProviderAccountData(), socialUser.getAuthorities());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return SocialAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
