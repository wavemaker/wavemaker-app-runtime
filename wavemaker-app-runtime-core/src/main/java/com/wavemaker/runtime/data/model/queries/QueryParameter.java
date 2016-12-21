package com.wavemaker.runtime.data.model.queries;

import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.runtime.data.replacers.providers.VariableType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 27/9/16
 */
public class QueryParameter {

    private String name;
    private JavaType type;
    private VariableType variableType;
    private Object testValue;
    private boolean list;

    public QueryParameter() {
    }

    public QueryParameter(final QueryParameter other) {
        this.name = other.name;
        this.type = other.type;
        this.variableType = other.variableType;
        this.testValue = other.testValue;
        this.list = other.list;
    }

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public JavaType getType() {
        return type;
    }

    public void setType(final JavaType type) {
        this.type = type;
    }

    public VariableType getVariableType() {
        return variableType;
    }

    public void setVariableType(final VariableType variableType) {
        this.variableType = variableType;
    }

    public Object getTestValue() {
        return testValue;
    }

    public void setTestValue(final Object testValue) {
        this.testValue = testValue;
    }

    public boolean isList() {
        return list;
    }

    public void setList(final boolean list) {
        this.list = list;
    }
}
