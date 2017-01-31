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

import java.io.File;

/**
 * A <code>PrefabFactory</code> instantiates a {@link Prefab}.
 *
 * @author Dilip Kumar
 */
public interface PrefabFactory {

    /**
     * Returns an appropriate {@link Prefab} for the jar file.
     *
     * @param prefabDir source file
     * @return {@link Prefab} object
     * @throws Exception if {@link Prefab} cannot be created
     */
    public Prefab newPrefab(File prefabDir) throws Exception;

}
