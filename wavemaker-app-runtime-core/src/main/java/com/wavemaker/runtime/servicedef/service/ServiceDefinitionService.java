package com.wavemaker.runtime.servicedef.service;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import com.wavemaker.runtime.servicedef.helper.ServiceDefinitionHelper;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.servicedef.model.ServiceDefinition;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 1/4/16
 */
@Service
public class ServiceDefinitionService {

    private static final Logger logger = LoggerFactory.getLogger(
            ServiceDefinitionService.class);

    private static String SERVICE_DEF_RESOURCE_POST_FIX = "-service-definitions.json";

    public static final String SERVICE_DEF_LOCATION_PATTERN = "/servicedefs/**" + SERVICE_DEF_RESOURCE_POST_FIX;

    private ServiceDefinitionHelper serviceDefBuilderHelper = new ServiceDefinitionHelper();

    private PathMatchingResourcePatternResolver patternResolver = new PathMatchingResourcePatternResolver();

    private Map<String, ServiceDefinition> serviceDefsCache = new HashMap<>();

    public Map<String, ServiceDefinition> listServiceDefs() {
        return serviceDefsCache;
    }

    @PostConstruct
    private void loadServiceDefs() {
        Resource[] resources = getServiceDefResources();
        if (resources != null) {
            for (Resource resource : resources) {
                try {
                    serviceDefsCache.putAll(serviceDefBuilderHelper.build(resource.getInputStream()));
                } catch (IOException e) {
                    throw new WMRuntimeException("Failed to generate service definition for file " + resource.getFilename(), e);
                }
            }
        } else {
            logger.warn("Service def resources does not exist for this project");
        }
    }

    private Resource[] getServiceDefResources() {
        try {
            return patternResolver.getResources(SERVICE_DEF_LOCATION_PATTERN);
        } catch (FileNotFoundException e) {
            //do nothing
            return new Resource[0];
        }catch (IOException e) {
            throw new WMRuntimeException("Failed to find service definition files", e);
        }
    }
}
