/**
 * Copyright (c) 2013 - 2014 WaveMaker, Inc. All Rights Reserved.
 *
 * This software is the confidential and proprietary information of WaveMaker, Inc.
 * You shall not disclose such Confidential Information and shall use it only in accordance
 * with the terms of the source code license agreement you entered into with WaveMaker, Inc.
 */

package com.wavemaker.runtime.rest.model.api;

import java.util.List;

/**
 * 
 * @author kayalv
 *
 */
public class OAuthProvider {
	
	private Provider provider;
    private String oAuthRequestCodeURL; 
    private String oAuthRequestTokenURL; 
    private String wmClientId; 
    private String wmClientSecret; 
    private String wmRedirectURL; 
    private List<OAuthScope> oAuthScopes;
    

    /**
     * @return the Oauth Authorization Code URL.
     * Must not be null
     */
    
    public String getoAuthRequestCodeURL() {
		return oAuthRequestCodeURL;
	}

    /**
     * Sets the Oauth Request Authorization Code URL.
     */
	public void setoAuthRequestCodeURL(String oAuthRequestCodeURL) {
		this.oAuthRequestCodeURL = oAuthRequestCodeURL;
	}
    
    /**
     * @return the Oauth Request Access Token URL.
     * Must not be null
     */
	public String getoAuthRequestTokenURL() {
		return oAuthRequestTokenURL;
	}
	
	 /**
     * Sets the Oauth Request Access Token URL.
     */

	public void setoAuthRequestTokenURL(String oAuthRequestTokenURL) {
		this.oAuthRequestTokenURL = oAuthRequestTokenURL;
	}
	

    /**
     * @return the Wm Client Id.
     * Must not be null
     */
    public final String getWmClientId() {
        return wmClientId;
    }

    /**
     * Sets the Wm Client Id.
     */
    public final void setWmClientId(String wmClientId) {
        this.wmClientId = wmClientId;
    }

    /**
     * @return the Wm Client Secret.
     * Must not be null
     */
    public final String getWmClientSecret() {
        return wmClientSecret;
    }

    /**
     * Sets the Wm Client Secret.
     */
    public final void setWmClientSecret(String wmClientSecret) {
        this.wmClientSecret = wmClientSecret;
    }

    /**
     * @return the Wm Redirect URL.
     * Must not be null
     */
    public final String getWmRedirectURL() {
        return wmRedirectURL;
    }

    /**
     * Sets the Wm Redirect URL.
     */
    public final void setWmRedirectURL(String wmRedirectURL) {
        this.wmRedirectURL = wmRedirectURL;
    }

    
    /**
     * @return the {@link Provider} object that this object is associated with.
     * Must not be null
     */
    public final Provider getProvider() {
        return provider;
    }

    /**
     * Sets the Provider.
     */
    public final void setProvider(Provider provider) {
        this.provider = provider;
    }

    /**
     * 
     * @return list of {@link OAuthScope} that this provider supports.
     * Must not be null
     */
	public List<OAuthScope> getoAuthScopes() {
		return oAuthScopes; 
	}

	/**
	 * 
	 * sets the list of {@link OAuthScope}
	 */
	public void setoAuthScopes(List<OAuthScope> oAuthScopes) {
		this.oAuthScopes = oAuthScopes;
	}

    
}
