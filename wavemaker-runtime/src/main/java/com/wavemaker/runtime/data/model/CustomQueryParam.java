package com.wavemaker.runtime.data.model;

public class CustomQueryParam {
	private String paramName = null;
    private String paramType = null;
    private String paramValue = null;
        
	public CustomQueryParam() {
		super();
	}
	
	public CustomQueryParam(String paramName, String paramType,
			String paramValue) {
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
	public String getParamValue() {
		return paramValue;
	}
	public void setParamValue(String paramValue) {
		this.paramValue = paramValue;
	}

	@Override
	public String toString() {
		return "CustomQueryParam [paramName=" + paramName + ", paramType="
				+ paramType + ", paramValue=" + paramValue + "]";
	}

}
