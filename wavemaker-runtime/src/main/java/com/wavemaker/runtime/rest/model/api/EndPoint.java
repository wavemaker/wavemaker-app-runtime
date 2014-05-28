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

public class EndPoint {

    private long endPointId;
    private String name;
    private String description;
    private String relativePath;
    private String docLink;
    @Valid
    private List<Operation> operations;

    /**
     * @return the Endpoint Identifier.
     * Must be > 0
     */
    public long getEndPointId() {
        return endPointId;
    }

    /**
     * sets the Endpoint Identifier.
     */
    public void setEndPointId(long endPointId) {
        this.endPointId = endPointId;
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
     * @return the Relative Path that this {@link EndPoint} object can be accessed.
     * Must not be null
     */
    public final String getRelativePath() {
        return relativePath;
    }

    /**
     * Sets the Relative Path.
     */
    public final void setRelativePath(String relativePath) {
        this.relativePath = relativePath;
    }

    /**
     * @return the external documentation link.
     */
    public final String getDocLink() {
        return docLink;
    }

    /**
     * Sets the Doc Link.
     */
    public final void setDocLink(String docLink) {
        this.docLink = docLink;
    }

    /**
     * @return List of {@link Operation} objects that this Endpoint has.
     * Must not be null
     */

    public List<Operation> getOperations() {
		return operations;
	}

	public void setOperations(List<Operation> operations) {
		this.operations = operations;
	}

	@Override
	public String toString() {
		return "EndPoint [endPointId=" + endPointId + ", name=" + name
				+ ", description=" + description + ", relativePath="
				+ relativePath + ", docLink=" + docLink + ", operations="
				+ operations + "]";
	}
	
    
}
