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

import java.util.ArrayList;
import java.util.List;

import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.NotEmpty;

/**
 * @author Sowmyad
 */
public class CustomProcedure {

	@NotBlank
	@NotEmpty
    private String procedureStr = null;

    private List<CustomProcedureParam> procedureParams = new ArrayList<>();

    public CustomProcedure() {
		super();
	}

	public CustomProcedure(String procedureStr, List<CustomProcedureParam> procedureParams) {
		super();
		this.procedureStr = procedureStr;
		this.procedureParams = procedureParams;
	}

    public String getProcedureStr() {
        return procedureStr;
    }

    public void setProcedureStr(String procedureStr) {
        this.procedureStr = procedureStr;
    }
    
    public List<CustomProcedureParam> getProcedureParams() {
        return procedureParams;
    }

    public void setProcedureParams(List<CustomProcedureParam> procedureParams) {
        this.procedureParams = procedureParams;
    }


}
