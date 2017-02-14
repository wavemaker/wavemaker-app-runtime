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
package com.wavemaker.runtime.data.model.procedures;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.validator.constraints.NotEmpty;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 5/10/16
 */
public class RuntimeProcedure {

    @NotEmpty
    private String procedureString;
    private List<ProcedureParameter> parameters;

    public RuntimeProcedure() {
        this.parameters = new ArrayList<>();
    }

    public RuntimeProcedure(final RuntimeProcedure other) {
        this.procedureString = other.procedureString;
        this.parameters = other.parameters;
    }

    public String getProcedureString() {
        return procedureString;
    }

    public void setProcedureString(final String procedureString) {
        this.procedureString = procedureString;
    }

    public List<ProcedureParameter> getParameters() {
        return parameters;
    }

    public void setParameters(final List<ProcedureParameter> parameters) {
        this.parameters = parameters;
    }
}
