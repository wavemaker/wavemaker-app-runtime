package com.wavemaker.runtime.service;

import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 17/11/16
 */
public interface ProcedureDesignService {

    DesignServiceResponse executeProcedure(String serviceId, RuntimeProcedure procedure);
}
