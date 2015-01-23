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
