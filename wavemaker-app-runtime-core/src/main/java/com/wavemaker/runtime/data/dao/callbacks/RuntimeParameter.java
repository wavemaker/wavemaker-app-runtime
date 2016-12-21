package com.wavemaker.runtime.data.dao.callbacks;

import java.util.Map;

import com.wavemaker.runtime.data.model.procedures.ProcedureParameter;

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
        return parameter.getVariableType().isSystemVariable() ?
                parameter.getVariableType().getValue(parameter.getType().getClassType()) :
                params.get(parameter.getName());
    }

    @Override
    public ProcedureParameter getParameter() {
        return parameter;
    }
}
