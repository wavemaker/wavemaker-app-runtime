package com.wavemaker.runtime.data.model.returns;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 26/10/16
 */
public class ReturnProperty {

    private String name;
    private String fieldName;

    private boolean optional;
    private FieldType fieldType;

    public ReturnProperty() {
    }

    public ReturnProperty(final String name, final FieldType fieldType) {
        this.name = name;
        this.fieldType = fieldType;
    }

    public ReturnProperty(final String name, final String fieldName, final FieldType fieldType) {
        this.name = name;
        this.fieldName = fieldName;
        this.fieldType = fieldType;
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

    public FieldType getFieldType() {
        return fieldType;
    }

    public void setFieldType(final FieldType fieldType) {
        this.fieldType = fieldType;
    }

    public boolean isOptional() {
        return optional;
    }

    public void setOptional(final boolean optional) {
        this.optional = optional;
    }
}
