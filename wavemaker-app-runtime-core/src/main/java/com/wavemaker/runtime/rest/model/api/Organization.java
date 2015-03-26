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

public class Organization {

	private long organizationId;
    private String name; 
    private String websiteUrl; 
    private byte[] logo; 
    private String vertical;
    private String phone; 
    private String addressLine1; 
    private String addressLine2;
    private String city; 
    private Long zipcode; 
    private String country; 
    
    /**
     * @return the Organization identifier
     */
    public long getOrganizationId() {
		return organizationId;
	}

    /**
     * Sets the Organization identifier.
     */
	public void setOrganizationId(long organizationId) {
		this.organizationId = organizationId;
	}

	/**
     * @return the organization Name.
     */
    public final String getName() {
        return name;
    }

    /**
     * Sets the organization Name.
     */
    public final void setName(String name) {
        this.name = name;
    }

    /**
     * @return the Website Url.
     */
    public final String getWebsiteUrl() {
        return websiteUrl;
    }

    /**
     * Sets the Website Url.
     */
    public final void setWebsiteUrl(String websiteUrl) {
        this.websiteUrl = websiteUrl;
    }

    /**
     * @return the Logo.
     */
    public final byte[] getLogo() {
        return logo;
    }

    /**
     * Sets the Logo.
     */
    public final void setLogo(byte[] logo) {
        this.logo = logo;
    }

    /**
     * @return the Vertical.
     */
    public final String getVertical() {
        return vertical;
    }

    /**
     * Sets the Vertical.
     */
    public final void setVertical(String vertical) {
        this.vertical = vertical;
    }

    /**
     * @return the Phone.
     */
    public final String getPhone() {
        return phone;
    }

    /**
     * Sets the Phone.
     */
    public final void setPhone(String phone) {
        this.phone = phone;
    }

    /**
     * @return the Address Line1.
     */
    public final String getAddressLine1() {
        return addressLine1;
    }

    /**
     * Sets the Address Line1.
     */
    public final void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }

    /**
     * @return the Address Line2.
     */
    public final String getAddressLine2() {
        return addressLine2;
    }

    /**
     * Sets the Address Line2.
     */
    public final void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
    }

    /**
     * @return the City.
     */
    public final String getCity() {
        return city;
    }

    /**
     * Sets the City.
     */
    public final void setCity(String city) {
        this.city = city;
    }

    /**
     * @return the Zipcode.
     */
    public final Long getZipcode() {
        return zipcode;
    }

    /**
     * Sets the Zipcode.
     */
    public final void setZipcode(Long zipcode) {
        this.zipcode = zipcode;
    }

    /**
     * @return the Country.
     */
    public final String getCountry() {
        return country;
    }

    /**
     * Sets the Country.
     */
    public final void setCountry(String country) {
        this.country = country;
    }

}
