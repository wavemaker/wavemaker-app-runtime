package com.wavemaker.runtime.data.model.queries;

import com.wavemaker.runtime.data.expression.AttributeType;
import com.wavemaker.runtime.data.replacers.providers.VariableType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 27/9/16
 */
public class QueryParameter {

    private String name;
    private AttributeType type;
    private VariableType variableType;
    private String testValue;
    private boolean list;

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public AttributeType getType() {
        return type;
    }

    public void setType(final AttributeType type) {
        this.type = type;
    }

    public VariableType getVariableType() {
        return variableType;
    }

    public void setVariableType(final VariableType variableType) {
        this.variableType = variableType;
    }

    public String getTestValue() {
        return testValue;
    }

    public void setTestValue(final String testValue) {
        this.testValue = testValue;
    }

    public boolean isList() {
        return list;
    }

    public void setList(final boolean list) {
        this.list = list;
    }
}
