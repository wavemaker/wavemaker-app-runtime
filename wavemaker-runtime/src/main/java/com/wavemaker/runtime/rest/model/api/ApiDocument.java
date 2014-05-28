/**
 * Copyright (c) 2013 - 2014 WaveMaker, Inc. All Rights Reserved.
 *
 * This software is the confidential and proprietary information of WaveMaker, Inc.
 * You shall not disclose such Confidential Information and shall use it only in accordance
 * with the terms of the source code license agreement you entered into with WaveMaker, Inc.
 */
package com.wavemaker.runtime.rest.model.api;

import java.util.List;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

/**
 *
 * @author kayalv
 */
public class ApiDocument {

	private long categoryId;
	private String version;
	private long apiId; 
	private String name; 
    private String description;
    @NotNull
    @NotBlank
    @URL
    private String baseURL;
    @Valid
    private List<EndPoint> endPoints;
    private String relativePath;
     
    /**
     * @return the API identifier.
     * Must be > 0
     */
    public long getApiId() {
		return apiId;
	}

    /**
     * Sets the API identifier.
     */
	public void setApiId(long apiId) {
		this.apiId = apiId;
	}

	/**
     * @return the Name.
     * Must not be null
     */
    public final String getName() {
        return name;
    }

    /**
     * Sets the Name.
     */
    public final void setName(String name) {
        this.name = name;
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

    /**
     * @return the Base URL that this {@link ApiDocument} can be accessed.
     * May be null
     */
    public final String getBaseURL() {
        return baseURL;
    }

    /**
     * Sets the Base URL that this {@link ApiDocument} can be accessed
     */
    public final void setBaseURL(String baseURL) {
        this.baseURL = baseURL;
    }

    /**
     * 
     * @return list of {@link EndPoint} that this api object is associated with
     */
	public List<EndPoint> getEndPoints() {
		return endPoints;
	}

	/**
	 * 
	 * @param endPoints
	 */
	public void setEndPoints(List<EndPoint> endPoints) {
		this.endPoints = endPoints;
	}

	public long getCategoryId() {
		return categoryId;
	}

	public void setCategoryId(long categoryId) {
		this.categoryId = categoryId;
	}

	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}

	public String getRelativePath() {
		return relativePath;
	}

	public void setRelativePath(String relativePath) {
		this.relativePath = relativePath;
	}

	@Override
	public String toString() {
		return "ApiDocument [categoryId=" + categoryId + ", version=" + version
				+ ", apiId=" + apiId + ", name=" + name + ", description="
				+ description + ", baseURL=" + baseURL + ", endPoints="
				+ endPoints + ", relativePath=" + relativePath + "]";
	}
	
}
