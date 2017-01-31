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

import com.wavemaker.runtime.data.metadata.DataObject;


/**
 * @author Sowmyad
 */
public class Procedure implements Comparable<Procedure> {

    @NotBlank
    @NotEmpty
    private String name = null;

    @NotBlank
    @NotEmpty
    private String procedure = null;

    private String comment = null;
    private String description = null;
    private String outputType;
    private boolean returnsSingleResult = false;
    private List<ProcedureParam> procedureParams = new ArrayList<>();
    private List<DataObject> returnTypeMetadata = new ArrayList<>();

    public Procedure() {
    }

    public Procedure(Procedure procedure) {
        this.name = procedure.getName();
        this.procedure = procedure.getProcedure();
        this.comment = procedure.getComment();
        this.description = procedure.getDescription();
        this.outputType = procedure.getOutputType();
        this.returnsSingleResult = procedure.isReturnsSingleResult();
        this.procedureParams = procedure.getProcedureParams();
        this.returnTypeMetadata = procedure.getReturnTypeMetadata();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProcedure() {
        return procedure;
    }

    public void setProcedure(String procedure) {
        this.procedure = procedure;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isReturnsSingleResult() {
        return returnsSingleResult;
    }

    public void setReturnsSingleResult(boolean returnsSingleResult) {
        this.returnsSingleResult = returnsSingleResult;
    }

    public List<ProcedureParam> getProcedureParams() {
        return procedureParams;
    }

    public void setProcedureParams(List<ProcedureParam> procedureParams) {
        this.procedureParams = procedureParams;
    }

    public String getOutputType() {
        return outputType;
    }

    public void setOutputType(String outputType) {
        this.outputType = outputType;
    }

    public List<DataObject> getReturnTypeMetadata() {
        return returnTypeMetadata;
    }

    public void setReturnTypeMetadata(final List<DataObject> returnTypeMetadata) {
        this.returnTypeMetadata = returnTypeMetadata;
    }

    @Override
    public int compareTo(final Procedure other) {
        return getName().compareToIgnoreCase(other.getName());
    }
}
