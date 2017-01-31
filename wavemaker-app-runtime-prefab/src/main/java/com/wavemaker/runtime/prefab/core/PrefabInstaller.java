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

import org.springframework.web.context.WebApplicationContext;

/**
 * Integrates {@link Prefab}s with the {@link WebApplicationContext} by registering
 * or unregistring its component classes. Once installed, they can start serving requests.
 * 
 * @author Dilip Kumar
 */
public interface PrefabInstaller {

    public void installPrefabs();

    public void uninstallPrefabs();

    /**
     * Installs the given {@link Prefab} by adding to the context of the
     * prefab servlet.
     * 
     * @param prefab {@link Prefab} to be installed
     */
    public void installPrefab(Prefab prefab);

}
