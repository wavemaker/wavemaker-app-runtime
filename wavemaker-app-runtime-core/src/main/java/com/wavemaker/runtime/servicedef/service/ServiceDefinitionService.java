package com.wavemaker.runtime.servicedef.service;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import com.wavemaker.runtime.servicedef.helper.ServiceDefinitionHelper;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.servicedef.model.ServiceDefinition;
import com.wavemaker.studio.prefab.core.Prefab;
import com.wavemaker.studio.prefab.core.PrefabManager;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 1/4/16
 */
@Service
public class ServiceDefinitionService {

    public static final String SERVICE_DEF_RESOURCE_POST_FIX = "-service-definitions.json";
    public static final String SERVICE_DEF_LOCATION_PATTERN = "/servicedefs/**" + SERVICE_DEF_RESOURCE_POST_FIX;
    public static final String PREFAB_SERVICE_DEF_LOCATION_PATTERN = "/prefab-servicedefs/**" + SERVICE_DEF_RESOURCE_POST_FIX;
    private static final Logger logger = LoggerFactory.getLogger(
            ServiceDefinitionService.class);
    private ServiceDefinitionHelper serviceDefinitionHelper = new ServiceDefinitionHelper();

    private Map<String, ServiceDefinition> serviceDefsCache = null;
    private Map<String, Map<String, ServiceDefinition>> prefabServiceDefsCache = null;

    @Autowired
    private PrefabManager prefabManager;

    public Map<String, ServiceDefinition> listServiceDefs() {
        if (serviceDefsCache == null) {
            loadServiceDefs();
        }
        return serviceDefsCache;
    }

    public Map<String, ServiceDefinition> listPrefabServiceDefs(final String prefabName) {
        if (prefabServiceDefsCache == null) {
            loadPrefabsServiceDefs();
        }
        if (prefabServiceDefsCache.get(prefabName) == null) {
            throw new WMRuntimeException("Prefab with name " + prefabName + " does not exist in this project");
        }
        return prefabServiceDefsCache.get(prefabName);
    }

    private synchronized void loadServiceDefs() {
        if (serviceDefsCache == null) {
            serviceDefsCache = new HashMap<>();
            Resource[] resources = getServiceDefResources(false);
            if (resources != null) {
                for (Resource resource : resources) {
                    try {
                        serviceDefsCache.putAll(serviceDefinitionHelper.build(resource.getInputStream()));
                    } catch (IOException e) {
                        throw new WMRuntimeException("Failed to generate service definition for file " + resource.getFilename(), e);
                    }
                }
            } else {
                logger.warn("Service def resources does not exist for this project");
            }
        }
    }

    private synchronized void loadPrefabsServiceDefs() {
        if (prefabServiceDefsCache == null) {
            prefabServiceDefsCache = new HashMap<>();
            for (final Prefab prefab : prefabManager.getPrefabs()) {
                runInPrefabClassLoader(prefab, new Runnable() {
                    @Override
                    public void run() {
                        loadPrefabServiceDefs(prefab);
                    }
                });
            }
        }
    }

    private synchronized void loadPrefabServiceDefs(final Prefab prefab) {
        if (prefabServiceDefsCache.get(prefab.getName()) == null) {
            prefabServiceDefsCache.put(prefab.getName(), new HashMap<String, ServiceDefinition>());
        }

        Resource[] resources = getServiceDefResources(true);
        if (resources != null) {
            for (Resource resource : resources) {
                try {
                    prefabServiceDefsCache.get(prefab.getName()).putAll(serviceDefinitionHelper.build(resource.getInputStream()));
                } catch (IOException e) {
                    throw new WMRuntimeException("Failed to generate service definition for file " + resource.getFilename(), e);
                }
            }
        } else {
            logger.warn("Service def resources does not exist for this project");
        }
    }

    private void runInPrefabClassLoader(final Prefab prefab, Runnable runnable) {
        ClassLoader classLoader = prefab.getClassLoader();
        ClassLoader currentClassLoader = Thread.currentThread().getContextClassLoader();
        try {
            Thread.currentThread().setContextClassLoader(classLoader);
            runnable.run();
        } finally {
            Thread.currentThread().setContextClassLoader(currentClassLoader);
        }

    }

    private Resource[] getServiceDefResources(boolean isPrefab) {
        try {
            PathMatchingResourcePatternResolver patternResolver = new PathMatchingResourcePatternResolver();
            if (isPrefab) {
                return patternResolver.getResources(PREFAB_SERVICE_DEF_LOCATION_PATTERN);
            }
            return patternResolver.getResources(SERVICE_DEF_LOCATION_PATTERN);
        } catch (FileNotFoundException e) {
            //do nothing
            return new Resource[0];
        } catch (IOException e) {
            throw new WMRuntimeException("Failed to find service definition files", e);
        }
    }

}
