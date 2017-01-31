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
package com.wavemaker.studio.prefab.core;

import java.util.Set;

import org.springframework.context.ConfigurableApplicationContext;

/**
 * <code>PrefabRegistry</code> keeps track of {@link String} Vs {@link ConfigurableApplicationContext} mapping.
 * 
 * @author Dilip Kumar
 */
public interface PrefabRegistry {

    /**
     * Adds a new mapping.
     * 
     * @param prefabName {@link String} to be added
     * @param prefabContext target {@link ConfigurableApplicationContext}
     */
    public void addPrefabContext(String prefabName, ConfigurableApplicationContext prefabContext);

    /**
     * Deletes an existing mapping.
     * 
     * @param prefabName {@link String} whose mapping is to be deleted
     */
    public void deletePrefabContext(String prefabName);

    /**
     * Returns the context mapped to the given URL.
     * 
     * @param prefabName URL whose mapping is to be retrieved
     * @return target {@link ConfigurableApplicationContext}, if any, else null
     */
    public ConfigurableApplicationContext getPrefabContext(String prefabName);

    /**
     * Retuns a collection of currently mapped URLs.
     * 
     * @return collection containing {@link String}
     */
    public Set<String> getPrefabs();

    /**
     * Deletes all mappings.
     */
    public void deletePrefabContexts();
}
