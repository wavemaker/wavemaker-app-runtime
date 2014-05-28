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


/**
 * 
 * @author kayalv
 *
 */
public class Operation {

	private long apiMethodId;
    @NotBlank
    @NotNull
    private String name; 
    private String description;
    private String notes;
    private String docLink;
    @NotBlank
    @NotNull
    private String relativePath;
    private boolean isDeprecated;
    @NotNull
	private HTTPMethod httpMethod;
    private List<DataFormat> produces;
    private List<DataFormat> consumes;
    @Valid
    private List<Parameter> parameters;
    private String returnType;
    private boolean isReturnTypeArray = false;
    private MethodPolicy policy;
    private boolean basicAuth;
    private String userName;
    private String password;

	/**
     * @return the API Method identifier.
     * Must be > 0
     */
    public long getApiMethodId() {
		return apiMethodId;
	}

    /**
     * Sets the API Method identifier.
     */
	public void setApiMethodId(long apiMethodId) {
		this.apiMethodId = apiMethodId;
	}

	/**
     * @return the method name.
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
     * @return the external documentation link for this method.
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
     * @return the Relative Path that this method can be accessed.
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
     * @return if this method is deprecated.
     */
    public final boolean isDeprecated() {
        return isDeprecated;
    }

    /**
     * Sets the Is Deprecated.
     */
    public void setDeprecated(boolean isDeprecated) {
		this.isDeprecated = isDeprecated;
	}

    /**
     * @return the {@link HTTPMethod} that this method supports.
     * Must not be null
     */
    public final HTTPMethod getHttpMethod() {
        return httpMethod;
    }

    /**
     * Sets the HttpMethod.
     */
    public final void setHttpMethod(HTTPMethod httpMethod) {
        this.httpMethod = httpMethod;
    }

    /**
     * @return the list of {@link DataFormat} those this {@link Operation} object produces.
     * It Must not be null
     */
	public List<DataFormat> getProduces() {
		return produces;
	}

	public void setProduces(List<DataFormat> produces) {
		this.produces = produces;
	}

	/**
     * @return the list of {@link DataFormat} those this {@link Operation} object consumes.
     * It Must not be null
     */
	public List<DataFormat> getConsumes() {
		return consumes;
	}

	public void setConsumes(List<DataFormat> consumes) {
		this.consumes = consumes;
	}

	/**
     * @return the list of {@link Parameter} asssociated with this {@link Operation} object.
     * It Must not be null
     */
	public List<Parameter> getParameters() {
		return parameters;
	}

	public void setParameters(List<Parameter> parameters) {
		this.parameters = parameters;
	}

	/**
     * @return the type of the method response.
     * It Must not be null
     */
	public String getReturnType() {
		return returnType;
	}

	public void setReturnType(String returnType) {
		this.returnType = returnType;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	/**
	 * @return 'true' if the return type of this method object is array.
	 * Default value is 'false'.
	 * 
	 */
	public boolean isReturnTypeArray() {
		return isReturnTypeArray;
	}

	public void setReturnTypeArray(boolean isReturnTypeArray) {
		this.isReturnTypeArray = isReturnTypeArray;
	}

	public MethodPolicy getPolicy() {
		return policy;
	}

	public void setPolicy(MethodPolicy policy) {
		this.policy = policy;
	}

    public boolean isBasicAuth() {
        return basicAuth;
    }

    public void setBasicAuth(boolean basicAuth) {
        this.basicAuth = basicAuth;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
	public String toString() {
		return "Operation [apiMethodId=" + apiMethodId + ", name=" + name
				+ ", description=" + description + ", notes=" + notes
				+ ", docLink=" + docLink + ", relativePath=" + relativePath
				+ ", isDeprecated=" + isDeprecated + ", httpMethod="
				+ httpMethod + ", produces=" + produces + ", consumes="
				+ consumes + ", parameters=" + parameters + ", returnType="
				+ returnType + ", isReturnTypeArray=" + isReturnTypeArray
				+ ", policy=" + policy + "]";
	}

	
	
}
