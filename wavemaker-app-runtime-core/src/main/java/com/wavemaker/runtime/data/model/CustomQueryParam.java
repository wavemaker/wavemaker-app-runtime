/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.model;

public class CustomQueryParam {

	private String paramName = null;
    private String paramType = null;
    private Object paramValue = null;
    private boolean isList = false;
        
	public CustomQueryParam() {
		super();
	}
	
	public CustomQueryParam(String paramName, String paramType, Object paramValue) {
		super();
		this.paramName = paramName;
		this.paramType = paramType;
		this.paramValue = paramValue;
	}
	
	public String getParamName() {
		return paramName;
	}
	public void setParamName(String paramName) {
		this.paramName = paramName;
	}

	public String getParamType() {
		return paramType;
	}
	public void setParamType(String paramType) {
		this.paramType = paramType;
	}

	public Object getParamValue() {
		return paramValue;
	}
	public void setParamValue(Object paramValue) {
		this.paramValue = paramValue;
	}

    public boolean isList() {
        return isList;
    }

    public void setList(boolean list) {
        isList = list;
    }

    @Override
	public String toString() {
		return "CustomQueryParam [paramName=" + paramName + ", paramType="
				+ paramType + ", paramValue=" + paramValue + "]";
	}

}
