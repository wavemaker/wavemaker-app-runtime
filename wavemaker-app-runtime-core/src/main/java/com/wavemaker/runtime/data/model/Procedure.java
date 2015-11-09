package com.wavemaker.runtime.data.model;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.NotEmpty;

/**
 * @author Sowmyad
 */
public class Procedure {

    @NotBlank
    @NotEmpty
    private String name = null;

    @NotBlank
    @NotEmpty
    private String procedure = null;

    private String comment = null;
    private String description = null;
    private boolean returnsSingleResult = false;
    private List<ProcedureParam> procedureParams = new ArrayList<>();


    public Procedure(Procedure procedure) {
        this.name = procedure.getName();
        this.procedure = procedure.getProcedure();
        this.comment = procedure.getComment();
        this.description = procedure.getDescription();
        this.returnsSingleResult = procedure.isReturnsSingleResult();
        this.procedureParams = procedure.getProcedureParams();
        this.outputType = procedure.getOutputType();
    }

    public Procedure() {
    }

    private String outputType;

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
}
