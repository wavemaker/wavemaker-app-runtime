package com.wavemaker.runtime.data.util;

import java.util.List;

import com.wavemaker.runtime.data.model.CustomProcedureParam;
import com.wavemaker.runtime.data.model.ProcedureParamType;

/**
 * @Author: sowmyad
 */
public  class ProceduresUtils {
    public static boolean hasOutParam(List<CustomProcedureParam> customProcedureParams) {
        for (CustomProcedureParam customProcedureParam : customProcedureParams) {
            if (hasOutParamType(customProcedureParam)) {
                return true;
            }
        }
        return false;
    }

    public  static boolean hasOutParamType(CustomProcedureParam procedureParam){
        return procedureParam.getProcedureParamType().equals(ProcedureParamType.IN_OUT) || procedureParam.getProcedureParamType().equals(ProcedureParamType.OUT);
    }

}
