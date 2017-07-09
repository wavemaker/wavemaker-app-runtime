/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 * <p/>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p/>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p/>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.servicedef.service;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.servicedef.model.ServiceDefinition;
import com.wavemaker.runtime.prefab.core.Prefab;
import com.wavemaker.runtime.prefab.core.PrefabManager;
import com.wavemaker.runtime.prefab.event.PrefabsLoadedEvent;
import com.wavemaker.runtime.servicedef.helper.ServiceDefinitionHelper;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 1/4/16
 */
@Service
public class ServiceDefinitionService implements ApplicationListener<PrefabsLoadedEvent> {

    public static final String SERVICE_DEF_RESOURCE_POST_FIX = "-service-definitions.json";
    public static final String SERVICE_DEF_LOCATION_PATTERN = "/servicedefs/**" + SERVICE_DEF_RESOURCE_POST_FIX;
    public static final String PREFAB_SERVICE_DEF_LOCATION_PATTERN = "/prefab-servicedefs/**" + SERVICE_DEF_RESOURCE_POST_FIX;
    private static final Logger logger = LoggerFactory.getLogger(
            ServiceDefinitionService.class);
    private ServiceDefinitionHelper serviceDefinitionHelper = new ServiceDefinitionHelper();

    private Map<String, ServiceDefinition> serviceDefinitionsCache = null;
    private Map<String, Map<String, ServiceDefinition>> prefabServiceDefinitionsCache = null;

    @Autowired
    private PrefabManager prefabManager;

    public Map<String, ServiceDefinition> listServiceDefs() {
        if (serviceDefinitionsCache == null) {
            loadServiceDefinitions();
        }
        return serviceDefinitionsCache;
    }

    public Map<String, ServiceDefinition> listPrefabServiceDefs(final String prefabName) {
        if (prefabServiceDefinitionsCache == null) {
            loadPrefabsServiceDefinitions();
        }
        Map<String, ServiceDefinition> serviceDefinitionMap = prefabServiceDefinitionsCache.get(prefabName);
        if (serviceDefinitionMap == null) {
            throw new WMRuntimeException("Prefab with name " + prefabName + " does not exist in this project");
        }
        return serviceDefinitionMap;
    }

    private void loadServiceDefinitions() {
        if (serviceDefinitionsCache == null) {
            synchronized (this) {
                if (serviceDefinitionsCache == null) {
                    Map<String, ServiceDefinition> serviceDefinitionsCache = new HashMap<>();
                    Resource[] resources = getServiceDefResources(false);
                    if (resources != null) {
                        for (Resource resource : resources) {
                            try {
                                serviceDefinitionsCache.putAll(serviceDefinitionHelper.build(resource.getInputStream()));
                            } catch (IOException e) {
                                throw new WMRuntimeException("Failed to generate service definition for file " + resource.getFilename(), e);
                            }
                        }
                    } else {
                        logger.warn("Service def resources does not exist for this project");
                    }
                    this.serviceDefinitionsCache = serviceDefinitionsCache;
                }
            }
        }
    }

    private void loadPrefabsServiceDefinitions() {
        if (prefabServiceDefinitionsCache == null) {
            synchronized (this) {
                if (prefabServiceDefinitionsCache == null) {
                    final Map<String, Map<String, ServiceDefinition>> prefabServiceDefinitionsCache = new HashMap<>();
                    for (final Prefab prefab : prefabManager.getPrefabs()) {
                        runInPrefabClassLoader(prefab, () -> loadPrefabServiceDefs(prefab, prefabServiceDefinitionsCache));
                    }
                    this.prefabServiceDefinitionsCache = prefabServiceDefinitionsCache;
                }
            }
        }
    }

    private synchronized void loadPrefabServiceDefs(final Prefab prefab, Map<String, Map<String, ServiceDefinition>> prefabServiceDefinitionsCache) {
        if (prefabServiceDefinitionsCache.get(prefab.getName()) == null) {
            prefabServiceDefinitionsCache.put(prefab.getName(), new HashMap<>());
        }

        Resource[] resources = getServiceDefResources(true);
        if (resources != null) {
            for (Resource resource : resources) {
                try {
                    prefabServiceDefinitionsCache.get(prefab.getName()).putAll(serviceDefinitionHelper.build(resource.getInputStream()));
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

    @Override
    public void onApplicationEvent(final PrefabsLoadedEvent event) {
        ExecutorService executor = null;
        try {
            executor = Executors.newFixedThreadPool(2);
            loadServiceDefinitions(executor);
        } finally {
            executor.shutdown();
        }
    }

    private void loadServiceDefinitions(ExecutorService executor) {
        executor.execute(() -> loadServiceDefinitions());
        executor.execute(() -> loadPrefabsServiceDefinitions());
    }

}
