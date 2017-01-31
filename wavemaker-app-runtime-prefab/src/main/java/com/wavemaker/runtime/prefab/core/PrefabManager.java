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
package com.wavemaker.runtime.prefab.core;

import java.util.Collection;

/**
 * A <code>PrefabManager</code> acts like a container to keep track of loaded {@link Prefab}s.
 * 
 * @author Dilip Kumar
 */
public interface PrefabManager {

    /**
     * Adds a new {@link Prefab}.
     * 
     * @param prefab prefab to be added
     */
    public void addPrefab(Prefab prefab);

    /**
     * Deletes an existing {@link Prefab}.
     * 
     * @param prefabName name of the prefab to be deleted
     */
    public void deletePrefab(String prefabName);

    public void deleteAllPrefabs();

    /**
     * Returns all enabled {@link Prefab}s.
     * 
     * @return enabled {@link Prefab}s
     */
    public Collection<Prefab> getPrefabs();

    /**
     * Returns the {@link Prefab} with the given name.
     * 
     * @param name name of the prefab
     * @return {@link Prefab}
     */
    public Prefab getPrefab(String name);
}
