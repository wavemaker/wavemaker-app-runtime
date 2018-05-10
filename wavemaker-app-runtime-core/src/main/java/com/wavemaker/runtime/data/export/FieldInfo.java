package com.wavemaker.runtime.data.export;

public class FieldInfo {
    private String header;
    private String field;
    private String expression;

    public FieldInfo(){}

    public FieldInfo(String field) {
        this.field = field;
    }

    public String getHeader() {
        return header;
    }

    public void setHeader(String header) {
        this.header = header;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

}
