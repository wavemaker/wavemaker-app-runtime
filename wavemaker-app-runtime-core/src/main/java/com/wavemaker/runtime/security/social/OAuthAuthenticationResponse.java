package com.wavemaker.runtime.security.social;

import org.springframework.social.security.SocialUser;

/**
 * @author Uday Shankar
 */
public class OAuthAuthenticationResponse {

    private SocialUser socialUser;

    public SocialUser getSocialUser() {
        return socialUser;
    }

    public void setSocialUser(SocialUser socialUser) {
        this.socialUser = socialUser;
    }
}
