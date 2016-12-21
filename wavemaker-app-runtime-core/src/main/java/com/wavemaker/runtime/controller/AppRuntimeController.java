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

import java.util.Properties;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.service.ProcedureDesignService;
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

    @Autowired
    private ProcedureDesignService procedureDesignService;

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
    public DesignServiceResponse executeQuery(
            @PathVariable("serviceId") String serviceId, @RequestBody RuntimeQuery query) {
        return queryDesignService.executeQuery(serviceId, query);
    }

    @RequestMapping(value = "{serviceId}/procedures/execute")
    public DesignServiceResponse executeProcedure(
            @PathVariable("serviceId") String serviceId, @RequestBody RuntimeProcedure procedure) {
        return procedureDesignService.executeProcedure(serviceId, procedure);
    }
}

