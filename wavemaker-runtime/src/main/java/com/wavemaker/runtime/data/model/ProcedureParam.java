/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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

    public ProcedureParam() {
    }

    public ProcedureParam(String paramName, ProcedureParamType procedureParamType, Boolean isList, String valueType) {
        this.paramName = paramName;
        this.procedureParamType = procedureParamType;
        this.isList = isList;
        this.valueType = valueType;
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

    @Override
    public String toString() {
        return this.paramName + ":" + this.procedureParamType + ":" + this.isList;
    }
}
