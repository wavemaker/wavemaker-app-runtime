/*
 * Copyright (C) 2012-2013 CloudJee, Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.wavemaker.studio.prefab.impl;

import java.io.File;
import java.util.logging.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
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
 * A composite {@link PrefabLoader} to load local and remote prefabs. All available prefabs are
 * (re)loaded on {@link ContextRefreshedEvent}.
 * 
 * @author Dilip Kumar
 */
@Service
public class PrefabLoaderImpl implements PrefabLoader, ApplicationListener<ApplicationEvent> {

    private static final Logger LOGGER = Logger.getLogger(PrefabLoaderImpl.class.getName());

    private File prefabDirectory;
    private PrefabUtils prefabUtils;

    @Autowired
    private ApplicationContext context;

    @Autowired
    private PrefabManager prefabManager;

    @Autowired
    private PrefabFactory prefabFactory;

    @Autowired
    public PrefabLoaderImpl(PrefabsConfig prefabsConfig, PrefabUtils prefabUtils) {
        this.prefabUtils = prefabUtils;
        this.prefabDirectory = prefabUtils.getDirectory(prefabsConfig.getPrefabsHomeDir());
    }

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
                LOGGER.warning(String.format("Prefab %s could not be loaded: %s (%s)", prefabDir.getName(), e, e.getCause()));
            }
        }

        publishEvent(new PrefabsLoadedEvent(context));
    }

    @Override
    public synchronized void loadPrefab(final File prefabDir)
            throws Exception {
        if (prefabManager == null) {
            LOGGER.info(String.format("PrefabManager not available, %s cannot load prefab %s", this.getClass().getSimpleName(),
                    prefabDir.getName()));
            return;
        }

        if (prefabFactory == null) {
            LOGGER.info(String.format("PrefabFactory not available, %s cannot load prefab %s",
                    this.getClass().getSimpleName(), prefabDir.getName()));
            return;
        }

        if (Utils.isReadableDirectory(prefabDir)) {
            prefabManager.addPrefab(prefabFactory.newPrefab(prefabDir));

            LOGGER.info(String.format("Loaded prefab %s", prefabDir.getName()));
        }
    }

    @Override
    public void onApplicationEvent(final ApplicationEvent event) {
        if (event instanceof ContextRefreshedEvent) {
            if (event.getSource() == context) {
                loadPrefabs();
            }
        }
    }

	protected File[] readPrefabDirs() {
        if (prefabDirectory == null) {
            LOGGER.warning("Prefabs directory is not defined or accessible, cannot load prefabs.");
            return PrefabConstants.ZERO_FILES;
        }
        return prefabUtils.listPrefabDirectories(prefabDirectory);
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
