package com.wavemaker.runtime.data.model.procedures;

import java.util.Map;

import org.springframework.util.LinkedCaseInsensitiveMap;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 5/10/16
 */
public enum ProcedureParameterType {
    IN {
        @Override
        public boolean isOutParam() {
            return false;
        }
    },
    OUT {
        @Override
        public boolean isInParam() {
            return false;
        }
    },
    IN_OUT;

    private static final Map<String, ProcedureParameterType> dbValueVsProcedureParamType = new LinkedCaseInsensitiveMap<>();

    static {
        dbValueVsProcedureParamType.put("IN", ProcedureParameterType.IN);
        dbValueVsProcedureParamType.put("OUT", ProcedureParameterType.OUT);
        dbValueVsProcedureParamType.put("INOUT", ProcedureParameterType.IN_OUT);
    }

    public boolean isOutParam() {
        return true;
    }

    public boolean isInParam() {
        return true;
    }

    public static ProcedureParameterType fromDB(String dbValue) {
        return dbValueVsProcedureParamType.get(dbValue);
    }
}
