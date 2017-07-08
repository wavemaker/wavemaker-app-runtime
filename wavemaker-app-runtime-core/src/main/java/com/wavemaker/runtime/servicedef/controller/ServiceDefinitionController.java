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
package com.wavemaker.runtime.servicedef.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.commons.servicedef.model.ServiceDefinition;
import com.wavemaker.runtime.servicedef.service.ServiceDefinitionService;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 21/3/16
 */

@RestController
public class ServiceDefinitionController {

    @Autowired
    private ServiceDefinitionService serviceDefinitionService;

    @RequestMapping(value = "/servicedefs", method = RequestMethod.GET)
    public Map<String, ServiceDefinition> listServiceDefs() {
        return serviceDefinitionService.listServiceDefs();
    }

    @RequestMapping(value = "/prefabs/{prefabName}/servicedefs", method = RequestMethod.GET)
    public Map<String, ServiceDefinition> listPrefabServiceDefs(@PathVariable("prefabName") String prefabName) {
        return serviceDefinitionService.listPrefabServiceDefs(prefabName);
    }

}
