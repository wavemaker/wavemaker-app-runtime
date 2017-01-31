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

/**
 * @author Sowmyad
 */
public class ProcedureParam {

    private String paramName = null;
    private ProcedureParamType procedureParamType = null;
    private String valueType = null;
    private Boolean isList = Boolean.FALSE;
    private String testValue;
    private boolean isSystemParam;
    private String systemParamName;

    public ProcedureParam() {
    }

    public ProcedureParam(final String paramName, final ProcedureParamType procedureParamType, final String valueType, final Boolean isList, final String testValue, final boolean isSystemParam, final String systemParamName) {
        this.paramName = paramName;
        this.procedureParamType = procedureParamType;
        this.valueType = valueType;
        this.isList = isList;
        this.testValue = testValue;
        this.isSystemParam = isSystemParam;
        this.systemParamName = systemParamName;
    }

    public String getValueType() {
        return valueType;
    }

    public void setValueType(String valueType) {
        this.valueType = valueType;
    }

    public String getParamName() {
        return this.paramName;
    }

    public void setParamName(String paramName) {
        this.paramName = paramName;
    }

    public ProcedureParamType getProcedureParamType() {
        return this.procedureParamType;
    }

    public void setProcedureParamType(ProcedureParamType procedureParamType) {
        this.procedureParamType = procedureParamType;
    }

    public Boolean getList() {
        return this.isList;
    }

    public void setList(Boolean isList) {
        this.isList = isList;
    }

    public String getTestValue() {
        return testValue;
    }

    public void setTestValue(final String testValue) {
        this.testValue = testValue;
    }

    public boolean isSystemParam() {
        return isSystemParam;
    }

    public void setSystemParam(final boolean isSystemParam) {
        this.isSystemParam = isSystemParam;
    }

    public String getSystemParamName() {
        return systemParamName;
    }

    public void setSystemParamName(final String systemParamName) {
        this.systemParamName = systemParamName;
    }

    @Override
    public String toString() {
        return this.paramName + ":" + this.procedureParamType + ":" + this.isList;
    }
}
