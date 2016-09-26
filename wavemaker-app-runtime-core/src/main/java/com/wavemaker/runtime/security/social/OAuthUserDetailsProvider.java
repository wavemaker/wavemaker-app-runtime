package com.wavemaker.runtime.security.social;

/**
 * @author Uday Shankar
 */
public interface OAuthUserDetailsProvider {

    OAuthAuthenticationResponse getOAuthAuthenticationDetails(OAuthAuthenticationRequestContext oAuthAuthenticationRequestContext);
}
