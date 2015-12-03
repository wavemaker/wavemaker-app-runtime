/**
 * Copyright © 2015 WaveMaker, Inc.
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
