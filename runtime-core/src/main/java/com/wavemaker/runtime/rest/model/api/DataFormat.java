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
public enum DataFormat {

	APPLICATION_JSON(1, "application/json"),
	APPLICATION_HTML(2, "application/xml"),
	TEXT_PLAIN(3, "text/plain"),
	TEXT_HTML(4, "text/html"),
	MULTIPART_FORM_DATA(5, "multipart/form-data"),
	APPLICATION_WWW_FORM_URL_ENCODED(6, "application/x-www-form-urlencoded");
	
	private int id;
	private String format;
	
	
	public int getId() {
		return id;
	}

	public String getFormat() {
		return format;
	}


	DataFormat(int id, String format) {
		this.format = format;
	}
	
	
	public static DataFormat getDataFormat(String formatString) {
		
		DataFormat dataFormat = null;
		for (DataFormat format : values()) {
			if (format.getFormat().equals(formatString)) {
				dataFormat =  format;
				break;
			}
		}
		return dataFormat;
	}
}
