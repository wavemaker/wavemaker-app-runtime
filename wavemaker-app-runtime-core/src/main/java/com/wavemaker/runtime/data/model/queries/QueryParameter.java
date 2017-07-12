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
package com.wavemaker.runtime.data.model.queries;

import javax.validation.constraints.NotNull;

import org.hibernate.validator.constraints.NotEmpty;

import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.runtime.data.replacers.providers.VariableType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 27/9/16
 */
public class QueryParameter {

    @NotEmpty
    private String name;
    @NotNull
    private JavaType type;
    private boolean list;

    @NotNull
    private VariableType variableType;
    private String variableName;

    private Object testValue;

    private boolean required = true;

    public QueryParameter() {
    }

    public QueryParameter(final QueryParameter other) {
        this.name = other.name;
        this.type = other.type;
        this.variableType = other.variableType;
        this.testValue = other.testValue;
        this.list = other.list;
        this.required = other.required;
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

    public String getVariableName() {
        return variableName;
    }

    public QueryParameter setVariableName(final String variableName) {
        this.variableName = variableName;
        return this;
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

    public boolean isRequired() {
        return required;
    }

    public void setRequired(final boolean required) {
        this.required = required;
    }
}
