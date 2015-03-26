/**
 * Copyright (c) 2013 - 2014 WaveMaker, Inc. All Rights Reserved.
 *
 * This software is the confidential and proprietary information of WaveMaker, Inc.
 * You shall not disclose such Confidential Information and shall use it only in accordance
 * with the terms of the source code license agreement you entered into with WaveMaker, Inc.
 */
package com.wavemaker.runtime.rest.model.api;

import java.util.List;
import java.util.Map;

/**
 * 
 * @author kayalv
 *
 */
public class MethodPolicy {

	private Map<String, List<OAuthScope>> authorizations;
    
	/**
     * @return {@link java.util.Map} of all {@link OAuthScope} permissions those a {@link Operation}
     * object requires to be accessed, with the authorization version as key.
     * For example, key could be 'oauth2', 'oauth1' etc...
     * 
     * May be null
     */
	
	public Map<String, List<OAuthScope>> getAuthorizations() {
		return authorizations;
	}

	public void setAuthorizations(Map<String, List<OAuthScope>> authorizations) {
		this.authorizations = authorizations;
	}

	@Override
	public String toString() {
		return "MethodPolicy [authorizations=" + authorizations + "]";
	}
	
}
