package com.wavemaker.runtime.data.model.procedures;

import com.wavemaker.runtime.data.model.queries.QueryParameter;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 5/10/16
 */
public class ProcedureParameter extends QueryParameter {

    private ProcedureParameterType parameterType;

    public ProcedureParameter() {
    }

    public ProcedureParameter(final ProcedureParameter other) {
        super(other);
        this.parameterType = other.parameterType;
    }

    public ProcedureParameterType getParameterType() {
        return parameterType;
    }

    public void setParameterType(final ProcedureParameterType parameterType) {
        this.parameterType = parameterType;
    }
}
