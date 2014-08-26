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
package com.wavemaker.common.classloader;


import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLConnection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.jar.JarFile;

/**
 * @author Dilip Kumar
 */
class PrefabJarFileCache
{
    private Map<URL, JarFile> fileCache = Collections.synchronizedMap(new HashMap<URL, JarFile>());
    private Map<JarFile, URL> urlCache = Collections.synchronizedMap(new HashMap<JarFile, URL>());

    URLConnection getConnection(JarFile jarfile)
            throws IOException
    {
        URL url = urlCache.get(jarfile);
        if (url != null) {
            return url.openConnection();
        } else {
            return null;
        }
    }

    JarFile get(URL jarURL, boolean cache)
            throws IOException
    {
        JarFile jarfile;
        try {
	        if (cache) {
	            synchronized (this) {
	                jarfile = getCachedJarFile(jarURL);
	            }
	            if (jarfile == null) {
	                JarFile jarfile1 = new JarFile(jarURL.toURI().getPath());
	                synchronized (this) {
	                    jarfile = getCachedJarFile(jarURL);
	                    if (jarfile == null) {
	                        fileCache.put(jarURL, jarfile1);
	                        urlCache.put(jarfile1, jarURL);
	                        jarfile = jarfile1;
	                    } else {
	                        jarfile1.close();
	                    }
	                }
	            }
	        } else {
	            jarfile = new JarFile(jarURL.toURI().getPath());
	        }
	        return jarfile;
        } catch (URISyntaxException use) {
        	IOException e = new IOException("Malformed URL : " + jarURL);
        	e.initCause(use);
        	throw e;
        }
    }

    private JarFile getCachedJarFile(URL url)
    {
        return fileCache.get(url);
    }

    public synchronized void close()
    {
        for (JarFile jarFile : urlCache.keySet()) {
            try {
                jarFile.close();
            } catch (IOException e) {
                //eat this
            }
        }
        urlCache.clear();
        fileCache.clear();
    }
}
