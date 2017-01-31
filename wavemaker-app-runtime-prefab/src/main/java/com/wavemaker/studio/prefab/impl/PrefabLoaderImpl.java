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
package com.wavemaker.studio.prefab.impl;

import java.io.File;
import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.ContextStoppedEvent;
import org.springframework.stereotype.Service;

import com.wavemaker.studio.prefab.config.PrefabsConfig;
import com.wavemaker.studio.prefab.core.PrefabFactory;
import com.wavemaker.studio.prefab.core.PrefabLoader;
import com.wavemaker.studio.prefab.core.PrefabManager;
import com.wavemaker.studio.prefab.event.PrefabEvent;
import com.wavemaker.studio.prefab.event.PrefabsLoadedEvent;
import com.wavemaker.studio.prefab.event.PrefabsUnloadedEvent;
import com.wavemaker.studio.prefab.util.PrefabConstants;
import com.wavemaker.studio.prefab.util.PrefabUtils;
import com.wavemaker.studio.prefab.util.Utils;

/**
 * Default implementation for {@link PrefabLoader}. All available prefabs are
 * (re)loaded on {@link ContextRefreshedEvent}.
 *
 * @author Dilip Kumar
 */
@Service
public class PrefabLoaderImpl implements PrefabLoader, ApplicationListener<ApplicationEvent> {

    private static final Logger LOGGER = LoggerFactory.getLogger(PrefabLoaderImpl.class);

    @Autowired
    private PrefabUtils prefabUtils;

    @Autowired
    private PrefabsConfig prefabsConfig;

    @Autowired
    private ApplicationContext context;

    @Autowired
    private PrefabManager prefabManager;

    @Autowired
    private PrefabFactory prefabFactory;

    /**
     * @return the prefabManager
     */
    public PrefabManager getPrefabManager() {
        return prefabManager;
    }

    /**
     * @return the prefabFactory
     */
    public PrefabFactory getPrefabFactory() {
        return prefabFactory;
    }

    public synchronized void loadPrefabs() {
        LOGGER.info("Context refreshed, (re)loading prefabs");

        publishEvent(new PrefabsUnloadedEvent(context));

        for (File prefabDir : readPrefabDirs()) {
            try {
                loadPrefab(prefabDir);
            } catch (Exception e) {
                LOGGER.warn("Prefab: [{}] could not be loaded", prefabDir.getName(), e);
            }
        }

        publishEvent(new PrefabsLoadedEvent(context));
    }

    @Override
    public synchronized void loadPrefab(final File prefabDir) throws Exception {
        if (Utils.isReadableDirectory(prefabDir)) {
            prefabManager.addPrefab(prefabFactory.newPrefab(prefabDir));
            LOGGER.info("Loaded prefab [{}]", prefabDir.getName());
        } else {
            LOGGER.warn("Cannot load prefab [{}], Reason: Access Denied!", prefabDir.getName());
        }
    }

    @Override
    public void onApplicationEvent(final ApplicationEvent event) {
        if (event instanceof ContextRefreshedEvent) {
            if (event.getSource() == context) {
                loadPrefabs();
            }
        } else if (event instanceof ContextClosedEvent || event instanceof ContextStoppedEvent) {
            if (event.getSource() == context) {
                publishEvent(new PrefabsUnloadedEvent(context));
            }
        }
    }

    protected File[] readPrefabDirs() {
        File[] prefabs;
        try {
            File prefabsDirectory = prefabUtils.getDirectory(prefabsConfig.getPrefabsHomeDir());
            prefabs = prefabUtils.listPrefabDirectories(prefabsDirectory);
        } catch (IOException e) {
            LOGGER.warn("Prefabs feature disabled. Reason: {}", e.getMessage());
            prefabs = PrefabConstants.ZERO_FILES;
        }
        return prefabs;
    }

    /**
     * Publishes th given {@link PrefabEvent} to the context.
     *
     * @param event event
     */
    private void publishEvent(final PrefabEvent event) {
        if (context != null) {
            context.publishEvent(event);
        }
    }
}
