package com.wavemaker.runtime.security.social;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
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
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        Assert.isInstanceOf(SocialAuthenticationToken.class, authentication, "unsupported authentication type");
        Assert.isTrue(!authentication.isAuthenticated(), "already authenticated");
        SocialAuthenticationToken socialAuthenticationToken = (SocialAuthenticationToken) authentication;

        OAuthAuthenticationRequestContext oAuthAuthenticationRequestContext = new OAuthAuthenticationRequestContext();
        oAuthAuthenticationRequestContext.setSocialAuthenticationToken(socialAuthenticationToken);
        OAuthAuthenticationResponse oAuthAuthenticationResponse = oAuthUserDetailsProvider.getOAuthAuthenticationDetails(oAuthAuthenticationRequestContext);

        if (oAuthAuthenticationResponse == null) {
            throw new UsernameNotFoundException("Not a valid user");
        }
        SocialUser socialUser = oAuthAuthenticationResponse.getSocialUser();
        return new SocialAuthenticationToken(socialAuthenticationToken.getConnection(), socialUser, socialAuthenticationToken.getProviderAccountData(), socialUser.getAuthorities());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return SocialAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
