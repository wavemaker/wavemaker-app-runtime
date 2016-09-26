package com.wavemaker.runtime.security.social;

import org.springframework.social.security.SocialAuthenticationToken;

/**
 * @author Uday Shankar
 */
public class OAuthAuthenticationRequestContext {

    SocialAuthenticationToken socialAuthenticationToken;

    public SocialAuthenticationToken getSocialAuthenticationToken() {
        return socialAuthenticationToken;
    }

    public void setSocialAuthenticationToken(SocialAuthenticationToken socialAuthenticationToken) {
        this.socialAuthenticationToken = socialAuthenticationToken;
    }
}
