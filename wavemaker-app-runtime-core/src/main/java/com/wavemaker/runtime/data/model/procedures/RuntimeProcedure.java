package com.wavemaker.runtime.data.model.procedures;

import java.util.ArrayList;
import java.util.List;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 5/10/16
 */
public class RuntimeProcedure {

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
