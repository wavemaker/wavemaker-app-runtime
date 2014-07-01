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
package com.wavemaker.studio.prefab.util;

import java.io.File;
import java.io.FileFilter;

import javax.servlet.ServletContext;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.wavemaker.studio.prefab.config.PrefabsConfig;

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
     * Returns the file path in servlet context.
     *
     * @param filePath
     * @return
     */
    public String getPathInContext(final String filePath) {
        /* To check any path in context we need prefix with {@link File.separator} */
        String pathInContext = (!filePath.startsWith(File.separator) ? (File.separator + filePath) :
                filePath);
        pathInContext = servletContext.getRealPath(pathInContext);
        LOGGER.info("File path for:" + filePath + ", in context is:" + pathInContext);
        return pathInContext;
    }

    /**
     * Returns {@link java.io.File} equivalent of the given directory path.
     *
     * @param directoryPath directory path
     * @return {@link java.io.File} representing the given directory path, null, if incorrect
     */
    public File getDirectory(String directoryPath) {
        if (!StringUtils.isEmpty(directoryPath)) {
            directoryPath = directoryPath.trim();

            // checking if it is a relative path (or) absolute path.
            if (!directoryPath.startsWith(File.separator)) {
                // if it is a relative path, looking the path in context.
                directoryPath = getPathInContext(directoryPath);
            }

            File directory = new File(directoryPath);
            if (directory.exists() && directory.isDirectory() && directory.canRead()) {
                return directory;
            }
        }
        return null;
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

    public boolean isDirContainsConfig(File directory) {
        return Utils.isGivenDirectoryAvaliable(directory, prefabsConfig.getPrefabConfigDir());
    }

    public boolean isDirContainsLib(File directory) {
        return Utils.isGivenDirectoryAvaliable(directory, prefabsConfig.getPrefabLibDir());
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

}
