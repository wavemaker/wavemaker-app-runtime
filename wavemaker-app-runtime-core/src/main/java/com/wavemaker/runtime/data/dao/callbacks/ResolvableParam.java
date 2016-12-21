package com.wavemaker.runtime.data.dao.callbacks;

import com.wavemaker.runtime.data.model.procedures.ProcedureParameter;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/11/16
 */
public interface ResolvableParam {

    Object getValue();

    ProcedureParameter getParameter();
}
