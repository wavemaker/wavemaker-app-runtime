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
