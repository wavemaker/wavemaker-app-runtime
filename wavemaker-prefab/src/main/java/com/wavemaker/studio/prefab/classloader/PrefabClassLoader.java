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
package com.wavemaker.studio.prefab.classloader;

import java.net.URL;
import java.net.URLClassLoader;

/**
 * Abstracts a prefab {@link ClassLoader}. <code>PrefabClassLoader</code> can load {@link Class}es only from
 * one jar file. Also, the prefab should be available in the format of a flat file.
 * 
 * @author Dilip kumar
 */
public class PrefabClassLoader extends URLClassLoader {
    private final String prefabName;

    /**
     * Creates a new <code>PrefabClassLoader</code> with the specified file.
     *
     * @param files
     *          list of files.
     * @throws Exception if source file is invalid
     */
    public PrefabClassLoader(URL[] files, String prefabName) {
		super(files, PrefabClassLoader.class.getClassLoader());
        this.prefabName = prefabName;
	}

    public String getPrefabName() {
        return prefabName;
    }

    @Override
    public String toString() {
        return "PrefabClassLoader{" +
                "prefabName='" + prefabName + '\'' +
                '}';
    }
}
