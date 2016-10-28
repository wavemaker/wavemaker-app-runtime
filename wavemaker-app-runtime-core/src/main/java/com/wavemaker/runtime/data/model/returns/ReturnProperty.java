package com.wavemaker.runtime.data.model.returns;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 26/10/16
 */
public class ReturnProperty {

    private String name;
    private String fieldName;

    private ReturnType returnType;

    public ReturnProperty() {
    }

    public ReturnProperty(final String name, final ReturnType returnType) {
        this.name = name;
        this.returnType = returnType;
    }

    public ReturnProperty(final String name, final String fieldName, final ReturnType returnType) {
        this.name = name;
        this.fieldName = fieldName;
        this.returnType = returnType;
    }

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public String getFieldName() {
        return fieldName;
    }

    public void setFieldName(final String fieldName) {
        this.fieldName = fieldName;
    }

    public ReturnType getReturnType() {
        return returnType;
    }

    public void setReturnType(final ReturnType returnType) {
        this.returnType = returnType;
    }
}
