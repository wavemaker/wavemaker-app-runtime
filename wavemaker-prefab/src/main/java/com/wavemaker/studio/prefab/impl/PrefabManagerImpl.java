/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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

import java.util.Collection;
import java.util.Map;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.Validate;
import org.springframework.stereotype.Service;

import com.wavemaker.studio.prefab.core.Prefab;
import com.wavemaker.studio.prefab.core.PrefabManager;
import com.wavemaker.studio.prefab.util.Utils;

/**
 * Default implementation for {@link PrefabManager}.
 *
 * @author Dilip Kumar
 */
@Service
public class PrefabManagerImpl implements PrefabManager {

    // map containing prefab name as key and prefab as value
    private static final Map<String, Prefab> prefabs = Utils.newConcurrentMap();

    @Override
    public synchronized void addPrefab(final Prefab prefab) {
        deletePrefab(prefab.getName());
        prefabs.put(prefab.getName(), prefab);
    }

    @Override
    public synchronized void deletePrefab(final String prefabName) {
        if (StringUtils.isEmpty(prefabName)) {
            return;
        }

        Prefab existingPrefab = getPrefab(prefabName);
        if (existingPrefab != null) {
            prefabs.remove(existingPrefab.getName().toLowerCase());
        }
    }

    @Override
    public synchronized void deleteAllPrefabs() {
        prefabs.clear();
    }

    @Override
    public Collection<Prefab> getPrefabs() {
        return CollectionUtils.unmodifiableCollection(prefabs.values());
    }

    @Override
    public Prefab getPrefab(final String prefabName) {
        Validate.notNull(prefabName, "PrefabManagerImpl: Prefab name should not be null");
        return prefabs.get(prefabName);
    }
}
