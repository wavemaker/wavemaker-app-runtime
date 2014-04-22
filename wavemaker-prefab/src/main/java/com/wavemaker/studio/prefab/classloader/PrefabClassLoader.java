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
package com.wavemaker.studio.prefab.classloader;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.Vector;
import java.util.jar.JarFile;

import org.apache.log4j.Logger;

/**
 * Abstracts a prefab {@link ClassLoader}. <code>PrefabClassLoader</code> can load {@link Class}es.
 *
 * @author Dilip kumar
 */
public class PrefabClassLoader extends URLClassLoader {

    private static final Logger LOGGER = Logger.getLogger(PrefabClassLoader.class);

    private final String prefabName;
    private Set<String> loadedJarFiles = new HashSet<String>();


    /**
     * Creates a new <code>PrefabClassLoader</code> with the specified file.
     *
     * @param files list of files.
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

    /**
     * Closes and releases locks for all opened files from class loader.
     * It wont throw any exception's even it fails to do some thing.
     */
    public void close() {
        closeJarFiles();
        finalizeNativeLibs();
    }


    /**
     * Close jar files of class loader.
     */
    public void closeJarFiles() {
        try {
            Field ucpField = getAccessibleField(URLClassLoader.class, "ucp");
            Object urlClassPathObj = ucpField.get(this);
            Field loadersField = getAccessibleField(urlClassPathObj, "loaders");
            Object collectionObj = loadersField.get(urlClassPathObj);
            for (Object urlClassPathJarLoader : (Collection) collectionObj) {
                String jarFileName = null;
                try {
                    Field loaderField = getAccessibleField(urlClassPathJarLoader, "jar");
                    Object jarFileObj = loaderField.get(urlClassPathJarLoader);
                    if (jarFileObj instanceof JarFile) {
                        JarFile jarFile = (JarFile) jarFileObj;
                        jarFileName = jarFile.getName();
                        loadedJarFiles.add(jarFileName);
                        jarFile.close();
                    }
                } catch (IOException e) {
                    LOGGER.warn("Error while closing jar file [" + jarFileName + "]");
                } catch (Throwable th) { // catching 'Throwable' to making sure that all jar's will be closed.
                    handleException(th, "Error while closing jar File [" + jarFileName + "]");
                }
            }
        } catch (Throwable t) {
            handleException(t, "Error while closing prefab class loader [" + prefabName + "]");
        } finally {
            cleanupJarFileFactory();
        }
    }

    /**
     * Finalizes the native libraries loaded by the class loader.
     */
    public void finalizeNativeLibs() {
        // now do native libraries
        try {
            Field nativeLibraries = getAccessibleField(ClassLoader.class, "nativeLibraries");
            Vector classLoaderNativeLibrary = (Vector) nativeLibraries.get(this);
            for (Object lib : classLoaderNativeLibrary) {
                try { // calling finalize method of native libraries
                    Method finalize = lib.getClass().getDeclaredMethod("finalize", new Class[0]);
                    finalize.setAccessible(true);
                    finalize.invoke(lib, new Object[0]);
                } catch (Throwable th) { //ignoring exceptions
                    handleException(th, "Error while finalizing native library[" + lib + "]");
                }
            } // ignoring exceptions
        } catch (Throwable th) {
            handleException(th, "Error while finalizing native libraries");
        }
    }

    private void handleException(Throwable t, String message) {
        boolean logStackTrace = true;
        if (t instanceof NoSuchFieldException) {
            message = "Error while accessing field, Probably it is not a SUN VM, Ignoring closeJar call, \n" + message;
            logStackTrace = false;
        }
        if (logStackTrace) {
            LOGGER.warn(message, t);
        } else {
            LOGGER.warn(message + ",\nReason:" + t.getMessage());
        }
    }

    /**
     * cleanup jar file factory cache
     */
    private void cleanupJarFileFactory() {
        try {
            Field factoryField = getAccessibleField(loadClass("sun.net.www.protocol.jar.JarURLConnection"), "factory");
            Object factoryFieldObj = factoryField.get(null);

            Field fileCacheField = getAccessibleField(factoryFieldObj, "fileCache");
            Field urlCacheField = getAccessibleField(factoryFieldObj, "urlCache");

            Map fileCache = getFieldValueOfMap(fileCacheField, null);
            Map urlCache = getFieldValueOfMap(urlCacheField, null);

            if (urlCache != null) {
                clearUrlCache(urlCache, fileCache);
            } else if (fileCache != null) {
                clearFileCache(fileCache);
            }
        } catch (Throwable th) {
            handleException(th, "Error while clearing JAR File Factory");
        } finally {
            // clearing jar files name
            loadedJarFiles.clear();
        }
    }

    /**
     * Returns HashMap Object from the given field, Returns 'null' if it is not a HashMap Object.
     *
     * @param field
     * @param obj
     * @return
     * @throws IllegalAccessException
     */
    private Map getFieldValueOfMap(Field field, Object obj) throws IllegalAccessException {
        Object fieldValue = field.get(obj);
        if (fieldValue instanceof Map) {
            return (Map) fieldValue;
        }
        return null;
    }

    /**
     * Clears this class loader jar file entries from file cache.
     *
     * @param fileCache
     */
    private void clearFileCache(Map fileCache) {
        Collection keys = fileCache.keySet();
        for (Object key : keys) {
            if (fileCache.get(key) instanceof JarFile) {
                JarFile jarFile = (JarFile) fileCache.get(key);
                if (loadedJarFiles.contains(jarFile.getName())) {
                    try {
                        jarFile.close();
                    } catch (IOException e) {
                        LOGGER.warn("Error while deleting jar file entry from file cache");
                    } finally {
                        fileCache.remove(key);
                    }
                }
            }
        }
    }

    /**
     * Clears this class loader jar file entries from url cache.
     *
     * @param urlCache
     * @param fileCache
     */
    private void clearUrlCache(Map urlCache, Map fileCache) {
        Set jarFiles = urlCache.keySet();
        for (Object jarFileObj : jarFiles) {
            if (jarFileObj instanceof JarFile) {
                JarFile jarFile = (JarFile) jarFileObj;
                if (loadedJarFiles.contains(jarFile.getName())) {
                    try {
                        jarFile.close();
                    } catch (IOException ie) {
                        LOGGER.warn("Error while deleting jar file entry from url cache");
                    } finally {
                        if (fileCache != null) { // removing url from fileCache
                            fileCache.remove(urlCache.get(jarFile));
                        }
                        urlCache.remove(jarFile);// removing jarFile from urlCache
                    }
                }
            }
        }
    }

    /**
     * Returns the field from the class and make sure that it is accessible.
     *
     * @param cls
     * @param fieldName
     * @return
     * @throws NoSuchFieldException
     */
    private Field getAccessibleField(Class cls, String fieldName) throws NoSuchFieldException {
        Field field = cls.getDeclaredField(fieldName);
        field.setAccessible(true);
        return field;
    }

    /**
     * Returns the field from the object and make sure that it is accessible.
     *
     * @param obj
     * @param fieldName
     * @return
     * @throws NoSuchFieldException
     */
    private Field getAccessibleField(Object obj, String fieldName) throws NoSuchFieldException {
        return getAccessibleField(obj.getClass(), fieldName);
    }
}
