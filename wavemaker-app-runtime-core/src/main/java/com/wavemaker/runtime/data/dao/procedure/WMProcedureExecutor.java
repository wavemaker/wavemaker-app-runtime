/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.dao.procedure;

import java.util.List;
import java.util.Map;

import com.wavemaker.runtime.data.model.CustomProcedure;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;

public interface WMProcedureExecutor {

    <T> List<T> executeNamedProcedure(String procedureName, Map<String, Object> params, Class<T> type);

    List<Object> executeRuntimeProcedure(RuntimeProcedure procedure);

    @Deprecated
    List<Object> executeNamedProcedure(String procedureName, Map<String, Object> params);

    @Deprecated
    List<Object> executeCustomProcedure(CustomProcedure customProcedure);

}
