/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.wavemaker.runtime.data.model.CustomProcedureParam;
import com.wavemaker.runtime.data.model.ProcedureParamType;
import com.wavemaker.runtime.data.model.procedures.ProcedureParameter;

/**
 * @Author: sowmyad
 */
public class ProceduresUtils {

    public static String PARAM = "{param}";
    public static final String PROCEDURE_PARAM_PATTERN = "(\\:" + PARAM + ")([\\s*,]|[\\s*|,]|[\\s*\\)?]|[\\s*|\\)?]|$)";
    public static final String PROCEDURE_PARAM_REPLACE_STRING = "?";

    public static boolean hasOutParam(List<CustomProcedureParam> customProcedureParams) {
        for (CustomProcedureParam customProcedureParam : customProcedureParams) {
            if (hasOutParamType(customProcedureParam)) {
                return true;
            }
        }
        return false;
    }

    public static boolean hasOutParamType(CustomProcedureParam procedureParam) {
        return procedureParam.getProcedureParamType().equals(ProcedureParamType.IN_OUT) || procedureParam
                .getProcedureParamType().equals(ProcedureParamType.OUT);
    }

    public static String jdbcComplianceProcedure(String procedureStr, List<ProcedureParameter> params) {
        String[] names = new String[params.size()];

        for (int i = 0; i < params.size(); i++) {
            final ProcedureParameter param = params.get(i);
            names[i] = param.getName();
        }

        return jdbcComplianceProcedure(procedureStr, names);
    }

    /**
     * Converts jdbc equivalent procedure string
     * eg , call exampleProcedure :sampleId,:sampleFirstName,:sampleLastName
     * convert it to : call exampleProcedure ?,?,?
     *
     * @param procedureStr procedure string
     * @param namedParams list of the named procedure parameters
     * @return jdbc compliance procedure.
     */
    public static String jdbcComplianceProcedure(final String procedureStr, final String[] namedParams) {
        String targetProcedureString = procedureStr;
        for (String namedParam : namedParams) {
            String procedurePattern = PROCEDURE_PARAM_PATTERN.replace(PARAM, namedParam);
            targetProcedureString = replaceProcedureParam(targetProcedureString, procedurePattern);
        }
        return targetProcedureString;
    }

    private static String replaceProcedureParam(final String procedureString, final String procedurePattern) {
        final Pattern pattern = Pattern.compile(procedurePattern);
        final Matcher matcher = pattern.matcher(procedureString);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            final String value = PROCEDURE_PARAM_REPLACE_STRING + matcher.group(2);
            matcher.appendReplacement(sb, value);
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

}
