package com.wavemaker.runtime.data.model;



public class CustomProcedureParam  {


    private Object paramValue = null;
    private String paramName = null;
    private ProcedureParamType procedureParamType = null;
    private String valueType = null;

	public CustomProcedureParam() {
		super();
	}

    public CustomProcedureParam(String paramName, Object paramValue, ProcedureParamType procedureParamType, String valueType) {
        this.procedureParamType = procedureParamType;
        this.paramName = paramName;
        this.valueType = valueType;
		this.paramValue = paramValue;
	}

    public String getParamName() {
        return paramName;
    }

    public void setParamName(String paramName) {
        this.paramName = paramName;
    }

    public ProcedureParamType getProcedureParamType() {
        return procedureParamType;
    }

    public void setProcedureParamType(ProcedureParamType procedureParamType) {
        this.procedureParamType = procedureParamType;
    }

    public String getValueType() {
        return valueType;
    }

    public void setValueType(String valueType) {
        this.valueType = valueType;
    }

    public void setParamValue(Object paramValue) {
		this.paramValue = paramValue;
	}
    public Object getParamValue(){
        return this.paramValue;
    }

	@Override
	public String toString() {
		return "CustomQueryParam [paramName=" + getParamName() + ",  paramValue=" + paramValue + "]";
	}

}
