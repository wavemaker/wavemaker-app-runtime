/**
 * Copyright (c) 2013 - 2014 WaveMaker, Inc. All Rights Reserved.
 *
 * This software is the confidential and proprietary information of WaveMaker, Inc.
 * You shall not disclose such Confidential Information and shall use it only in accordance
 * with the terms of the source code license agreement you entered into with WaveMaker, Inc.
 */

package com.wavemaker.runtime.rest.model.api;

/**
 * 
 * @author kayalv
 *
 */
public class OAuthScope {

    private String scope; 
    private String description;

    /**
     * @return the scope name
     */
    public String getScope() {
		return scope;
	}

	public void setScope(String scope) {
		this.scope = scope;
	}

	/**
     * @return the Description.
     */
    public final String getDescription() {
        return description;
    }

    /**
     * Sets the Description.
     */
    public final void setDescription(String description) {
        this.description = description;
    }

	@Override
	public String toString() {
		return "OAuthScope [scope=" + scope + ", description=" + description
				+ "]";
	}

}
