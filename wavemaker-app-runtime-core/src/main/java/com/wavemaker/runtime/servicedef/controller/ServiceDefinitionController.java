package com.wavemaker.runtime.servicedef.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.runtime.servicedef.service.ServiceDefinitionService;
import com.wavemaker.commons.servicedef.model.ServiceDefinition;

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
