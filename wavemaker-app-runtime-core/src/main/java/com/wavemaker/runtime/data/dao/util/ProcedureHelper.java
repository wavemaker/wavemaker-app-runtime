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
package com.wavemaker.runtime.data.dao.util;

import java.util.Arrays;
import java.util.List;

import org.hibernate.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.data.model.CustomProcedureParam;

public class ProcedureHelper {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProcedureHelper.class);

    public static void configureParameters(Query query, List<CustomProcedureParam> params) {
        String[] namedParameters = query.getNamedParameters();
        if (namedParameters != null && namedParameters.length > 0) {
            if (params == null || params.isEmpty())
                throw new RuntimeException("Require input parameters such as: " + Arrays.asList(namedParameters));

            for (CustomProcedureParam param : params) {
                Object val = param.getParamValue();
                if (val == null)
                    throw new RuntimeException("No value provided for parameter name: " + param.getParamName());
                query.setParameter(param.getParamName(), val);
            }
        }
    }


}
