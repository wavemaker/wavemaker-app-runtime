package com.wavemaker.runtime.data.dao.procedure.parameters;

import com.wavemaker.runtime.data.model.procedures.ProcedureParameter;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/11/16
 */
public class TestParameter implements ResolvableParam {

    private ProcedureParameter parameter;

    public TestParameter(final ProcedureParameter parameter) {
        this.parameter = parameter;
    }

    @Override
    public Object getValue() {
        return parameter.getTestValue();
    }

    @Override
    public ProcedureParameter getParameter() {
        return parameter;
    }
}
