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
package com.wavemaker.runtime.prefab.impl;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Service;

import com.wavemaker.runtime.prefab.core.PrefabRegistry;
import com.wavemaker.runtime.prefab.util.Utils;

/**
 * Default implementation of {@link PrefabRegistry}.
 * 
 * @author Dilip Kumar
 */
@Service("prefabRegistry")
public class PrefabRegistryImpl implements PrefabRegistry {

    private final Map<String, ConfigurableApplicationContext> prefabRegistryMap = Utils.newConcurrentMap();

    @Override
    public synchronized void addPrefabContext(final String prefabName, final ConfigurableApplicationContext context) {
        prefabRegistryMap.put(prefabName, context);
    }

    @Override
    public synchronized void deletePrefabContext(final String prefabName) {
        prefabRegistryMap.remove(prefabName);
    }

    @Override
    public ConfigurableApplicationContext getPrefabContext(final String prefabName) {
        return prefabRegistryMap.get(prefabName);
    }

    @Override
    public Set<String> getPrefabs() {
        return Collections.unmodifiableSet(prefabRegistryMap.keySet());
    }

    @Override
    public void deletePrefabContexts() {
        prefabRegistryMap.clear();
    }
}
