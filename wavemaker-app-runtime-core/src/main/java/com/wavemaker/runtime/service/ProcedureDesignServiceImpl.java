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
package com.wavemaker.runtime.service;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.dao.procedure.WMProcedureExecutor;
import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.commons.util.StringTemplate;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 17/11/16
 */
public class ProcedureDesignServiceImpl extends AbstractDesignService implements ProcedureDesignService {

    private static final StringTemplate PROCEDURE_EXECUTOR_BEAN_ST = new StringTemplate(
            "${serviceId}WMProcedureExecutor");


    @Override
    public DesignServiceResponse testRunProcedure(final String serviceId, final RuntimeProcedure procedure) {
        final Map<String, String> map = getStringTemplateMap(serviceId);
        final String procedureExecutorBeanName = PROCEDURE_EXECUTOR_BEAN_ST.substitute(map);
        return executeInTransaction(serviceId, new TransactionCallback<DesignServiceResponse>() {
            @Override
            public DesignServiceResponse doInTransaction(final TransactionStatus status) {
                final WMProcedureExecutor wmProcedureExecutor = WMAppContext.getInstance()
                        .getSpringBean(procedureExecutorBeanName);

                final Object result = wmProcedureExecutor.executeRuntimeProcedure(procedure);
                final List<ReturnProperty> properties = extractMetaFromResults(Collections.singleton(result));

                return new DesignServiceResponse(result, properties);
            }
        });
    }
}
