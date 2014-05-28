/**
 * Copyright (c) 2013 - 2014 WaveMaker, Inc. All Rights Reserved.
 *
 * This software is the confidential and proprietary information of WaveMaker, Inc.
 * You shall not disclose such Confidential Information and shall use it only in accordance
 * with the terms of the source code license agreement you entered into with WaveMaker, Inc.
 */
package com.wavemaker.runtime.rest.model.api;

import java.sql.Timestamp;
import java.util.Date;

/**
 * 
 * @author kayalv
 *
 */

public class Provider {

	private long providerId;
    private boolean isActive; 
    private Timestamp dtJoined; 
    private Timestamp dtModified; 
    private Organization organization;
    
    /**
     * @return the provider identifier
     */
	public long getProviderId() {
		return providerId;
	}

	/**
	 * sets the provider identifier
	 */
	public void setProviderId(long providerId) {
		this.providerId = providerId;
	}

	/**
	 * 
	 * @return if the provider is active
	 */
	public boolean isActive() {
		return isActive;
	}
	
	/**
	 * sets the provider active status
	 */
	public void setActive(boolean isActive) {
		this.isActive = isActive;
	}
	
	/**
	 * 
	 * @return the date the provider has joined. Must not be null
	 * 
	 */
	public Date getDtJoined() {
		return dtJoined;
	}
	
	/**
	 * sets the date joined for the provider
	 */
	public void setDtJoined(Timestamp dtJoined) {
		this.dtJoined = dtJoined;
	}
	
	/**
	 * @return the modified date of the provider object. Must not be null
	 */
	public Timestamp getDtModified() {
		return dtModified;
	}
	
	/**
	 * sets the modified date for the provider object
	 */
	public void setDtModified(Timestamp dtModified) {
		this.dtModified = dtModified;
	}
	
	/**
	 * 
	 * @return the {@link Organization} that this provider object is associated with.
	 * Must not be null;
	 */
	public Organization getOrganization() {
		return organization;
	}
	
	/**
	 * sets the {@link Organization} that this provider is associated with.
	 */
	public void setOrganization(Organization organization) {
		this.organization = organization;
	}

	@Override
	public String toString() {
		return "Provider [providerId=" + providerId + ", isActive=" + isActive
				+ ", dtJoined=" + dtJoined + ", dtModified=" + dtModified
				+ ", organization=" + organization + "]";
	}
   
	
}
