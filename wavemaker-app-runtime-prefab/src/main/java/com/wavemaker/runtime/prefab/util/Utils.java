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
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Set of utility methods.
 *
 * @author Dilip Kumar
 */
public class Utils {

    /**
     * Returns integer value for the given system property.
     *
     * @param key          property key
     * @param defaultValue default value
     * @return set value or default value in case of error
     */
    public static String getStringSystemProperty(final String key, final String defaultValue) {
        String value = defaultValue;

        try {
            String _value = System.getProperty(key);
            value = _value == null ? defaultValue : _value.trim();
        } catch (Exception e) {
            // ignore
        }

        return value;
    }

    /**
     * Checks if the given file is a usable jar file.
     *
     * @param file file
     * @return true, if a usable jar file
     */
    public static boolean isReadableJarFile(final File file) {
        return file != null && file.isFile() && file.getName().endsWith(".jar") && file.canRead();
    }


    /**
     * Returns a filter for a jar files.
     *
     * @return {@link java.io.FileFilter} for jars
     */
    public static FileFilter getJarFilter() {
        return new FileFilter() {

            @Override
            public boolean accept(final File file) {
                return isReadableJarFile(file);
            }
        };
    }

    public static boolean isReadableDirectory(File directory) {
        return directory != null && directory.isDirectory() && directory.canRead();
    }

    public static boolean isNotReadableDirectory(File directory) {
        return !isReadableDirectory(directory);
    }

    public static boolean isGivenDirectoryAvaliable(File homeDir, String requiredDirName) {
        File[] files = homeDir.listFiles();
        for (File file : files) {
            if (file.isDirectory() && file.getName().equals(requiredDirName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the url list of files path.
     *
     * @param files
     * @return
     */
    public static URL[] convertToURLS(File configDir, File[] files) {
        List<URL> urls = new ArrayList<>();
        for (File file : files) {
            try {
                urls.add(file.toURI().toURL());
            } catch (MalformedURLException mue) {
                // ignoring file
            }
        }
        try {
            urls.add(configDir.toURI().toURL());
        } catch (MalformedURLException e) {
            // ignoring file
        }
        return urls.toArray(new URL[]{});
    }


    /**
     * Returns a concrete implementation of {@link java.util.concurrent.ConcurrentMap}.
     *
     * @return {@link java.util.concurrent.ConcurrentMap}
     */
    public static <K, V> Map<K, V> newConcurrentMap() {
        return new ConcurrentHashMap<>();
    }
}
