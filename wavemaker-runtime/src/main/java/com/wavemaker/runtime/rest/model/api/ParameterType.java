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

public enum ParameterType {

	QUERY (1),
	PATH(2),
	BODY(3),
	FORM(4),
	HEADER(4);
	
	private int id;
	
	ParameterType(int id) {
		this.id = id;
	}
	
	public int getId() {
		return id;
	}

	public ParameterType getParamType(int id) {
		
		ParameterType paramType = null;
		for (ParameterType type : values()) {
			if (type.getId() == id) {
				paramType =  type;
				break;
			}
		}
		return paramType;
	}
}
