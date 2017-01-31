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

import com.wavemaker.commons.util.SortedList;


/**
 * @author sowmyad
 */
public class ProcedureModel {

    private String name;
    private String description;
    private List<Procedure> procedures = null;

    public ProcedureModel() {
    }

    public ProcedureModel(final String name, final String description, final List<Procedure> procedures) {
        this.name = name;
        this.description = description;
        this.procedures = new SortedList<>(procedures);
    }

    public ProcedureModel(ProcedureModel procedureModel) {
        this.name = procedureModel.getName();
        this.description = procedureModel.getDescription();
        this.procedures = new SortedList<>(procedureModel.getProcedures());
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Procedure> getProcedures() {
        if (procedures == null) {
            return new SortedList<>(new ArrayList<Procedure>());
        }
        return procedures;
    }

    public void setProcedures(List<Procedure> procedures) {
        this.procedures = new SortedList<>(procedures);
    }


}
