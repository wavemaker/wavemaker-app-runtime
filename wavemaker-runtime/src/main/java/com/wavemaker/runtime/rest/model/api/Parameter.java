/**
 * Copyright (c) 2013 - 2014 WaveMaker, Inc. All Rights Reserved.
 *
 * This software is the confidential and proprietary information of WaveMaker, Inc.
 * You shall not disclose such Confidential Information and shall use it only in accordance
 * with the terms of the source code license agreement you entered into with WaveMaker, Inc.
 */
package com.wavemaker.runtime.rest.model.api;

import java.util.List;

import javax.validation.constraints.NotNull;

import org.hibernate.validator.constraints.NotBlank;

/**
 *
 * @author kayalv
 * @param <T>
 * 
 */

public class Parameter {

	private long idParameter;
    @NotBlank
    @NotNull
    private String name;
    private String description;
    private String fullyQualifiedType;
    private String format;
    private boolean isOptional;
    private boolean isArray;
    private int index;
    private String docLink;
    private String defaultValue;
    @NotNull
    private ParameterType parameterType;
    private List<Object> allowableValues;
    private double minimum;
    private double maximum;

    public Parameter() {
    }

    public Parameter(String name, ParameterType parameterType) {
        this.name = name;
        this.parameterType = parameterType;
    }

    /**
     * @return the Parameter identifier.
     * Must be > 0
     */
    public final long getIdParameter() {
        return idParameter;
    }

    /**
     * Sets the Id Parameter.
     */
    public final void setIdParameter(long idParameter) {
        this.idParameter = idParameter;
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
     * @return the Fully Qualified Type of this parameter object
     * Must not be null
     */
    public final String getFullyQualifiedType() {
        return fullyQualifiedType;
    }

    /**
     * Sets the Fully Qualified Type.
     */
    public final void setFullyQualifiedType(String fullyQualifiedType) {
        this.fullyQualifiedType = fullyQualifiedType;
    }

    /**
     * @return the if this parameter is an optional parameter or not
     */
    public final boolean isOptional() {
        return isOptional;
    }

    /**
     * Sets the Is Optional.
     */
   	public void setOptional(boolean isOptional) {
		this.isOptional = isOptional;
	}

    /**
     * @return if this parameter is of array type
     */
    public final boolean isArray() {
        return isArray;
    }

    /**
     * Sets the Is Array.
     */
	public void setArray(boolean isArray) {
		this.isArray = isArray;
	}

    /**
     * @return the index. By default it is 0. 
     * If this parameter object is of {@link ParameterType.PATH} type, then the index of the parameter object
     * is captured here.
     * 
     */
    public final int getIndex() {
        return index;
    }

    /**
     * Sets the Index.
     */
    public final void setIndex(int index) {
        this.index = index;
    }

    /**
     * @return the external documentation link for this parameter object.
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
     * @return the {@link ParameterType}.
     * Must not be null
     */
    public final ParameterType getParameterType() {
        return parameterType;
    }

    /**
     * Sets the {@link ParameterType}.
     */
    public final void setParameterType(ParameterType paramterType) {
        this.parameterType = paramterType;
    }
    /**
     * @return The {@link java.util.List} of allowable values for this parameter.
     * For example: if the parameter name is 'statu's and it can accept only the 
     * values specified here {'pending, 'available', 'sold'}, 
     * then this list of values could be captured here.
     */
   
    public List<Object> getAllowableValues() {
		return allowableValues;
	}

	public void setAllowableValues(List<Object> allowableValues) {
		this.allowableValues = allowableValues;
	}

    /**
     * @return default value for the parameter if exists. Otherwise null;
     */
	public String getDefaultValue() {
		return defaultValue;
	}

	
	/**
	 * sets the defaultValue
	 */
	public void setDefaultValue(String defaultValue) {
		this.defaultValue = defaultValue;
	}

	 /**
     * @return minimum value for the parameter if exists.
     */
	public double getMinimum() {
		return minimum;
	}

	/**
	 * 
	 * sets the minimum value for the parameter.
	 */
	public void setMinimum(double minimum) {
		this.minimum = minimum;
	}

	/**
	 * 
	 * @return maximum value for the parameter if exists.
	 */
	public double getMaximum() {
		return maximum;
	}

	/**
	 * 
	 * sets the maximum value for the parameter.
	 */
	public void setMaximum(double maximum) {
		this.maximum = maximum;
	}

	public String getFormat() {
		return format;
	}

	public void setFormat(String format) {
		this.format = format;
	}

	@Override
	public String toString() {
		return "Parameter [idParameter=" + idParameter + ", name=" + name
				+ ", description=" + description + ", fullyQualifiedType="
				+ fullyQualifiedType + ", format=" + format + ", isOptional="
				+ isOptional + ", isArray=" + isArray + ", index=" + index
				+ ", docLink=" + docLink + ", defaultValue=" + defaultValue
				+ ", parameterType=" + parameterType + ", allowableValues="
				+ allowableValues + ", minimum=" + minimum + ", maximum="
				+ maximum + "]";
	}
}
