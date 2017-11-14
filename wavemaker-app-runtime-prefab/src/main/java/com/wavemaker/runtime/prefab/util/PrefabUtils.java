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
package com.wavemaker.runtime.prefab.util;

import java.io.File;
import java.io.FileFilter;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Objects;

import javax.servlet.ServletContext;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.util.WebUtils;

import com.wavemaker.runtime.prefab.config.PrefabsConfig;

/**
 * @author Dilip Kumar
 */
@Service
public class PrefabUtils {
    private static final Logger LOGGER = LoggerFactory.getLogger(PrefabUtils.class);

    @Autowired
    private ServletContext servletContext;
    @Autowired
    private PrefabsConfig prefabsConfig;


    /**
     * Returns {@link java.io.File} equivalent of the given directory path.
     *
     * @param path directory path
     * @return {@link java.io.File} representing the given directory path, null, if incorrect
     */
    public File getDirectory(String path) throws IOException {
        Objects.requireNonNull(path, "Path cannot be null");
        String realPath = path.trim();
        //looking the path in context.
        realPath = WebUtils.getRealPath(servletContext, realPath);
        File directory = new File(realPath);
        if (!directory.exists()) {
            throw new FileNotFoundException(
                    "File not exist in ServletContext resource with given path: [" + path + "]");
        } else if (Utils.isNotReadableDirectory(directory)) {
            throw new IOException("Given path [" + path + "] is not a directory (or) doesn't have read permissions.");
        } else {
            return directory;
        }
    }


    /**
     * Reads jar files for the given prefab.
     *
     * @return jar files, if any
     */
    public File[] readJarFilesForPrefab(final File prefabDir) {
        File libDirectory = getPrefabLibDirectory(prefabDir);
        File[] jars = null;
        if (libDirectory.exists()) {
            jars = libDirectory.listFiles(Utils.getJarFilter());
        }
        return jars == null ? PrefabConstants.ZERO_FILES : jars;
    }

    public File getPrefabLibDirectory(final File prefabDirectory) {
        return new File(prefabDirectory, prefabsConfig.getPrefabLibDir());
    }

    public File getPrefabConfigDirectory(final File prefabDirectory) {
        return new File(prefabDirectory, prefabsConfig.getPrefabConfigDir());
    }

    public File getPrefabBuildDirectory(final  File prefabDirectory){
        return new File(prefabDirectory,prefabsConfig.getPrefabBuildDir());
    }

    public boolean isDirContainsConfig(File directory) {
        File prefabConfigDirectory = new File(directory, prefabsConfig.getPrefabConfigDir());
        if (prefabConfigDirectory.exists() && prefabConfigDirectory.isDirectory()) {
            File[] files = prefabConfigDirectory.listFiles();
            return files.length > 0;// Valid prefab config folder if it contains atleast one file
        }
        return false;
    }

    public boolean isDirContainsLib(File directory) {
        File prefabLibDirectory = new File(directory, prefabsConfig.getPrefabLibDir());
        if (prefabLibDirectory.exists() && prefabLibDirectory.isDirectory()) {
            File[] files = prefabLibDirectory.listFiles();
            return files.length > 0;// Valid prefab lib folder if it contains atleast one file
        }
        return false;
    }

    public boolean isPrefabDirectory(File pathName) {
        // we need "lib" or "config" directory should be exists.
        return (isDirContainsConfig(pathName) || isDirContainsLib(pathName));
    }

    /**
     * Returns the filter for identify prefab directories
     *
     * @return
     */
    public FileFilter getPrefabDirectoryFilter() {
        return new FileFilter() {

            public boolean accept(final File pathname) {
                return Utils.isReadableDirectory(pathname) && isPrefabDirectory(pathname);
            }

        };
    }

    /**
     * Scans for the prefab directories. i.e Prefab directory must contain atleast one jar
     *
     * @param directory
     * @return
     */
    public File[] listPrefabDirectories(File directory) {
        File[] dirs = directory.listFiles(getPrefabDirectoryFilter());
        return (dirs == null) ? PrefabConstants.ZERO_FILES : dirs;
    }

    public static String sanitizePrefabName(String prefabName) {
        return prefabName.trim().replaceAll("\\s+", "_");
    }

}
