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

import java.io.BufferedInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.security.Permission;
import java.util.List;
import java.util.Map;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

/**
 * @author Dilip Kumar
 */
public class PrefabJarURLConnection
        extends java.net.JarURLConnection
{
    private URLConnection jarFileURLConnection;
    private String entryName;
    private JarEntry jarEntry;
    private JarFile jarFile;
    private String contentType;
    private final PrefabJarFileCache jarCache;

    public PrefabJarURLConnection(URL url, PrefabJarFileCache jarCache)
            throws IOException
    {
        super(url);
        this.jarCache = jarCache;
        jarFileURLConnection = getJarFileURL().openConnection();
        entryName = getEntryName();
    }

    public JarFile getJarFile() throws IOException
    {
        connect();
        return jarFile;
    }

    public JarEntry getJarEntry() throws IOException
    {
        connect();
        return jarEntry;
    }

    public Permission getPermission() throws IOException
    {
        return jarFileURLConnection.getPermission();
    }

    public void connect() throws IOException
    {
        if (!connected) {
            jarFile = jarCache.get(getJarFileURL(), getUseCaches());

            if (getUseCaches()) {
                jarFileURLConnection = jarCache.getConnection(jarFile);
            }

            if ((entryName != null)) {
                jarEntry = (JarEntry) jarFile.getEntry(entryName);
                if (jarEntry == null) {
                    try {
                        if (!getUseCaches()) {
                            jarFile.close();
                        }
                    } catch (Exception e) {
                        //eat this
                    }
                    throw new FileNotFoundException("JAR entry " + entryName +
                            " not found in " +
                            jarFile.getName());
                }
            }
            connected = true;
        }
    }

    public InputStream getInputStream() throws IOException
    {
        connect();
        InputStream result;

        if (entryName == null) {
            throw new IOException("no entry name specified");
        } else {
            if (jarEntry == null) {
                throw new FileNotFoundException("JAR entry " + entryName +
                        " not found in " +
                        jarFile.getName());
            }
            //$Fixme!$ should track this inputstream and close if not closed by the application.
            result = new JarURLInputStream(jarFile.getInputStream(jarEntry));
        }
        return result;
    }

    public int getContentLength()
    {
        int result = -1;
        try {
            connect();
            if (jarEntry == null) {
                /* if the URL referes to an archive */
                result = jarFileURLConnection.getContentLength();
            } else {
                /* if the URL referes to an archive entry */
                result = (int) getJarEntry().getSize();
            }
        } catch (IOException e) {
            //eat this
        }
        return  result;
    }

    public Object getContent() throws IOException
    {
        connect();
        if (entryName == null) {
            return jarFile;
        } else {
            return super.getContent();
        }
    }

    public String getContentType()
    {
        if (contentType == null) {
            if (entryName == null) {
                contentType = "x-java/jar";
            } else {
                try {
                    connect();
                    InputStream in = jarFile.getInputStream(jarEntry);
                    contentType = guessContentTypeFromStream(
                            new BufferedInputStream(in));
                    in.close();
                } catch (IOException e) {
                    // don't do anything
                }
            }
            if (contentType == null) {
                contentType = guessContentTypeFromName(entryName);
            }
            if (contentType == null) {
                contentType = "content/unknown";
            }
        }
        return contentType;
    }

    public String getHeaderField(String name)
    {
        return jarFileURLConnection.getHeaderField(name);
    }

    public void setRequestProperty(String key, String value)
    {
        jarFileURLConnection.setRequestProperty(key, value);
    }

    public String getRequestProperty(String key)
    {
        return jarFileURLConnection.getRequestProperty(key);
    }

    public void addRequestProperty(String key, String value)
    {
        jarFileURLConnection.addRequestProperty(key, value);
    }

    public Map<String, List<String>> getRequestProperties()
    {
        return jarFileURLConnection.getRequestProperties();
    }

    public void setAllowUserInteraction(boolean allowuserinteraction)
    {
        jarFileURLConnection.setAllowUserInteraction(allowuserinteraction);
    }

    public boolean getAllowUserInteraction()
    {
        return jarFileURLConnection.getAllowUserInteraction();
    }

    public void setUseCaches(boolean usecaches)
    {
        jarFileURLConnection.setUseCaches(usecaches);
    }

    public boolean getUseCaches()
    {
        return jarFileURLConnection.getUseCaches();
    }

    public void setIfModifiedSince(long ifmodifiedsince)
    {
        jarFileURLConnection.setIfModifiedSince(ifmodifiedsince);
    }

    public void setDefaultUseCaches(boolean defaultusecaches)
    {
        jarFileURLConnection.setDefaultUseCaches(defaultusecaches);
    }

    public boolean getDefaultUseCaches()
    {
        return jarFileURLConnection.getDefaultUseCaches();
    }

    class JarURLInputStream
            extends BufferedInputStream
    {
        private volatile boolean closed;

        JarURLInputStream(InputStream src)
        {
            super(src);
        }

        public void close() throws IOException
        {
            if (!closed) {
                closed = true;
                try {
                    super.close();
                } finally {
                    if (!getUseCaches()) {
                        synchronized (jarCache) {
                            jarFile.close();
                        }
                    }
                }
            }
        }

        protected void finalize() throws Throwable
        {
            if (!getUseCaches()) {
                close();
            }
        }
    }
}
