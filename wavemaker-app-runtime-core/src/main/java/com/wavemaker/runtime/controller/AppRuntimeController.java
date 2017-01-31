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
package com.wavemaker.runtime.controller;

import java.util.Properties;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
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
import com.wavemaker.commons.util.PropertiesFileUtils;
import com.wavemaker.commons.wrapper.StringWrapper;

/**
 * @author Sowmya
 */

@RestController
@RequestMapping("/")
public class AppRuntimeController {

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
    @RequestMapping(method = RequestMethod.POST, value = "/{serviceId}/queries/test_run")
    public DesignServiceResponse testRunQuery(
            @PathVariable("serviceId") String serviceId, @RequestBody RuntimeQuery query, Pageable pageable) {
        return queryDesignService.testRunQuery(serviceId, query, pageable);
    }

    @RequestMapping(method = RequestMethod.POST, value = "{serviceId}/procedures/test_run")
    public DesignServiceResponse testRunProcedure(
            @PathVariable("serviceId") String serviceId, @RequestBody RuntimeProcedure procedure) {
        return procedureDesignService.testRunProcedure(serviceId, procedure);
    }

    @RequestMapping(method = RequestMethod.POST, value = "/{serviceId}/queries/execute")
    public Object executeQuery(
            @PathVariable("serviceId") String serviceId, @RequestBody RuntimeQuery query, Pageable pageable) {
        return queryDesignService.executeQuery(serviceId, query, pageable);
    }


}

