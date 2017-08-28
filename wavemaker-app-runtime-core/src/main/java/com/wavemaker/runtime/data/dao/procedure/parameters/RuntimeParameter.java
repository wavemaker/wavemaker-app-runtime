/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.dao.procedure.parameters;

import java.util.Map;

import com.wavemaker.runtime.data.model.procedures.ProcedureParameter;
import com.wavemaker.runtime.data.replacers.providers.VariableType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/11/16
 */
public class RuntimeParameter implements ResolvableParam {

    private ProcedureParameter parameter;
    private Map<String, Object> params;

    public RuntimeParameter(final ProcedureParameter parameter, final Map<String, Object> params) {
        this.parameter = parameter;
        this.params = params;
    }

    @Override
    public Object getValue() {
        final Object value;
        final VariableType variableType = parameter.getVariableType();
        if (variableType.isVariable()) {
            value = parameter.getType().fromDbValue(variableType.getValue(parameter.getVariableName()));
        } else {
            value = params.get(parameter.getName());
        }

        return parameter.getType().toDbValue(value);
    }

    @Override
    public ProcedureParameter getParameter() {
        return parameter;
    }
}
