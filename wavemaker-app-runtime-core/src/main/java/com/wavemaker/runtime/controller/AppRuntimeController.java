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
package com.wavemaker.runtime.controller;

import java.util.List;
import java.util.Properties;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.dao.procedure.WMProcedureExecutor;
import com.wavemaker.runtime.data.metadata.DataObject;
import com.wavemaker.runtime.data.metadata.ProcedureMetaData;
import com.wavemaker.runtime.data.model.CustomProcedure;
import com.wavemaker.runtime.data.model.ProcedureResponse;
import com.wavemaker.runtime.data.model.QueryResponse;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.service.QueryDesignService;
import com.wavemaker.studio.common.util.PropertiesFileUtils;
import com.wavemaker.studio.common.wrapper.StringWrapper;

/**
 * @author Sowmya
 */

@RestController
@RequestMapping("/")
public class AppRuntimeController {

    private static final String QUERY_EXECUTOR_BEAN_NAME = "{serviceId}WMQueryExecutor";
    private static final String TRANSACTION_MANAGER_BEAN_NAME = "{serviceId}TransactionManager";
    private static final String PROCEDURE_EXECUTOR_BEAN_NAME = "{serviceId}WMProcedureExecutor";
    private static final String PROCEDURE_PARENT_DATA_OBJECT_NAME = "{serviceId}DataObject";

    private String applicationType = null;

    @Autowired
    private QueryDesignService queryDesignService;

    @RequestMapping(value = "/application/type", method = RequestMethod.GET)
    public StringWrapper getApplicationType() {
        if (applicationType == null) {
            synchronized (this) {
                if (applicationType == null) {
                    Properties properties = PropertiesFileUtils.loadFromXml(
                            AppRuntimeController.class.getClassLoader().getResourceAsStream(".wmproject.properties"));
                    applicationType = properties.getProperty("type");
                }
            }
        }
        return new StringWrapper(applicationType);
    }

    // XXX restrict this method in app runtime.
    @RequestMapping(value = "/{serviceId}/queries/execute")
    public QueryResponse executeQuery(@PathVariable("serviceId") String serviceId, @RequestBody RuntimeQuery query) {
        return queryDesignService.executeQuery(serviceId, query);
    }

    @RequestMapping(value = "/{serviceId}/queries/wm_querymetadata")
    public List<ReturnProperty> generateMetadata(
            @PathVariable("serviceId") String serviceId, @RequestBody RuntimeQuery query) {
        return queryDesignService.extractMeta(serviceId, query);
    }

    @RequestMapping(value = "/{serviceId}/procedures/wm_proceduremetadata", method = RequestMethod.POST)
    public ProcedureResponse createMetaDataForProcedures(
            @RequestBody final CustomProcedure customProcedure, @PathVariable("serviceId") final String serviceId) {
        final String procedureExecutorBeanName = PROCEDURE_EXECUTOR_BEAN_NAME.replaceAll("\\{serviceId\\}", serviceId);
        String transactionManagerBeanName = TRANSACTION_MANAGER_BEAN_NAME.replaceAll("\\{serviceId\\}", serviceId);

        PlatformTransactionManager transactionManager = WMAppContext.getInstance()
                .getSpringBean(transactionManagerBeanName);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return txTemplate.execute(new TransactionCallback<ProcedureResponse>() {
            @Override
            public ProcedureResponse doInTransaction(TransactionStatus status) {

                WMProcedureExecutor wmProcedureExecutor = WMAppContext.getInstance()
                        .getSpringBean(procedureExecutorBeanName);
                List<Object> response = wmProcedureExecutor.executeCustomProcedure(customProcedure);

                ProcedureResponse procedureResponse = new ProcedureResponse();
                procedureResponse.setProcedureResult(response);
                procedureResponse.setMetaData(buildMetaData(response));

                return procedureResponse;
            }

            private List<DataObject> buildMetaData(final List<Object> response) {
                String metaDataName = PROCEDURE_PARENT_DATA_OBJECT_NAME.replaceAll("\\{serviceId\\}", serviceId);
                return new ProcedureMetaData(metaDataName).constructMetadata(response);
            }
        });
    }

}

