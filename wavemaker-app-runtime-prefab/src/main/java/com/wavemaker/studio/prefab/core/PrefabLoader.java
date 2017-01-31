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
 * A <code>PrefabLoaderImpl</code> is responsible for loading {@link Prefab} from a single source
 * (local directory or remote system).
 * 
 * @author Dilip Kumar
 */
public interface PrefabLoader {

    /**
     * Loads all prefabs. This involves reading the source files/streams and creating their
     * equivalent {@link Prefab}s. Possible {@link RuntimeException}s should be logged
     * and not thrown to the caller.
     */
    public void loadPrefabs();

    /**
     * Loads {@link Prefab} from the given jar file.
     * 
     * @param jarFile prefab jar file
     * @throws Exception if the jar file is invalid
     */
    public void loadPrefab(final File jarFile) throws Exception;
}
