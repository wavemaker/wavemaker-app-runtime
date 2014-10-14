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
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLClassLoader;
import java.net.URLConnection;
import java.net.URLStreamHandler;
import java.security.CodeSource;
import java.security.cert.Certificate;
import java.util.*;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.jar.Manifest;
import java.util.zip.ZipException;
import java.util.zip.ZipFile;
import java.util.zip.ZipInputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.common.classloader.jar.JarUtils;
import com.wavemaker.common.classloader.jar.ManifestClasspathHelper;


/**
 * Extends the functionality provided by URLClassLoader by: <ul> <li> Does not lock zip files <li> Caches the entries in
 * the zip files </ul>
 * <p/>
 * Supports adding all URL types.
 *
 * @author Dilip Kumar
 */

public class WMUrlClassLoader
        extends URLClassLoader {
    private static final Logger logger = LoggerFactory.getLogger(WMUrlClassLoader.class.getName());
    private ResourceFinder mFinder = null;
    private URL[] defaultURLs = null;
    private static final String pathSep = File.pathSeparator;
    private static ResourceFinder commonAppJarsFinder = new ResourceFinder(new URL[]{}, false, false);
    private boolean delegateToParent = true;
    private String loaderContext = "";
    private List children = new LinkedList();
    private static ThreadLocal threadLocalForInitializerCL = new ThreadLocal();
    private static boolean classLoaderDebugging = false;
    private volatile boolean closed = false;

    private static final boolean TRACK_OPEN_FILES = false;
    private static final boolean USE_CONNECTION_FOR_STREAM = false;


    public WMUrlClassLoader(URL[] urls, String loaderContext) {
        super(urls, Thread.currentThread().getContextClassLoader());
        setLoaderContext(loaderContext);
        if (urls == null) {
            urls = new URL[0];
        }
        mFinder = new ResourceFinder(urls, TRACK_OPEN_FILES, USE_CONNECTION_FOR_STREAM);

        //Child classLoaders are saved with the parent
        ClassLoader parentCL = getParent();
        while (parentCL != null) {
            if (parentCL instanceof WMUrlClassLoader) {
                ((WMUrlClassLoader) parentCL).addChild(this);
                break;
            }

            parentCL = parentCL.getParent();
        }
    }

    public void close() {
        mFinder.close();
        closed = true;
    }

    protected void finalize() throws Throwable {
        if (!closed) {
            close();
        }
        super.finalize();
    }

    public void setDelegateToParent(boolean delegateToParent) {
        this.delegateToParent = delegateToParent;
    }

    public boolean isDelegateToParent() {
        return delegateToParent;
    }

    public void setLoaderContext(String loaderContext) {
        this.loaderContext = loaderContext;
    }


    public static void setClassLoaderDebugging(boolean classloaderDebugging) {
        classLoaderDebugging = classloaderDebugging;
    }


    public String getLoaderContext() {
        return this.loaderContext;
    }

    private void addChild(ClassLoader child) {
        synchronized (children) {
            Iterator itr = children.iterator();
            while (itr.hasNext()) {
                WeakReference wr = (WeakReference) itr.next();
                if (wr.get() == null) {
                    itr.remove();
                }
            }
            children.add(new WeakReference(child));
        }
    }

    public void disassociateFromHierarchy() {
        ClassLoader parent = getParent();
        if (parent instanceof WMUrlClassLoader) {
            synchronized (((WMUrlClassLoader) parent).children) {
                Iterator itr = ((WMUrlClassLoader) parent).children.listIterator();
                while (itr.hasNext()) {
                    WeakReference weak = (WeakReference) itr.next();
                    ClassLoader loader = (ClassLoader) weak.get();
                    if (loader == null || (loader != null && this.equals(loader))) {
                        itr.remove();
                    }
                }
            }
        }
    }

    public URL findResource(String name) {
        return mFinder.findResource(name);
    }

    public Enumeration findResources(String name) throws IOException {
        //$Fixme!$ the implementation is not compliant with the javadoc on ClassLoader. We are returning all
        // resources that
        //start with name. We should return all resources that match name exactly
        return mFinder.findResources(name);
    }

    public String getClassPath() {
        URL[] mainURLs = getMainClassPathRecursively();
        URL[] commonURLs = WMUrlClassLoader.commonAppJarsFinder.getURLs();
        URL[] temp = new URL[mainURLs.length + commonURLs.length];

        System.arraycopy(mainURLs, 0, temp, 0, mainURLs.length);
        System.arraycopy(commonURLs, 0, temp, mainURLs.length, commonURLs.length);

        StringBuffer buf = new StringBuffer();
        for (int i = 0; i < temp.length; i++) {
            URL url = temp[i];
            //buf.append(url.getPath().replace('/', File.separatorChar)+File.separator+url.getFile()+File
            // .pathSeparator);
            try {
                String str = new File(url.toURI().getPath()).getAbsolutePath() + pathSep;
                buf.append(str);
            } catch (URISyntaxException e) {
                logger.debug("Unable to resolve URL : " + url, e);
                // Move on to the next URL
            }
        }
        return buf.toString();
    }

    public String getTokenizedClasspath() {
        String classpath = getClassPath();
        StringTokenizer pathTokenizer = new StringTokenizer(classpath, pathSep);
        StringBuffer buf = new StringBuffer();

        while (pathTokenizer.hasMoreTokens()) {
            String entry = pathTokenizer.nextToken();
            buf.append("    ").append(entry).append("\n");
        }
        return buf.toString();
    }

    public String getOnlyMyClassPath() {

        URL[] mainURLs = mFinder.getURLs();
        URL[] commonURLs = WMUrlClassLoader.commonAppJarsFinder.getURLs();
        URL[] temp = new URL[mainURLs.length + commonURLs.length];

        System.arraycopy(mainURLs, 0, temp, 0, mainURLs.length);
        System.arraycopy(commonURLs, 0, temp, mainURLs.length, commonURLs.length);

        StringBuffer buf = new StringBuffer();
        for (int i = 0; i < temp.length; i++) {
            URL url = temp[i];
            try {
                String str = new File(url.toURI().getPath()).getAbsolutePath() + pathSep;
                buf.append(str);
            } catch (URISyntaxException e) {
                logger.debug("Unable to resolve URL : " + url, e);
                // Move on to the next URL
            }
        }
        return buf.toString();
    }

    public String toString() {
        return ("\nProton URL Class Loader " + loaderContext + "\nClasspath [" + getOnlyMyClassPath() +
                "]\n - Delegation to Parent CL [" +
                delegateToParent +
                "]");
    }

    protected URL[] getMainClassPathRecursively() {
        URL[] myURLs = mFinder.getURLs();
        ClassLoader parentCl = this.getParent();
        if (parentCl != null && parentCl instanceof WMUrlClassLoader) {
            URL[] parentList = ((WMUrlClassLoader) parentCl).getMainClassPathRecursively();
            for (int i = 0; i < parentList.length; i++) {
                boolean contains = false;
                URL url = parentList[i];
                // check if the URL got is already present.
                for (int j = 0; j < myURLs.length; j++) {
                    if (url.equals(myURLs[j])) {
                        contains = true;
                        break;
                    }
                }
                if (!contains) {
                    // not present- add the URL
                    URL[] temp = new URL[myURLs.length + 1];
                    System.arraycopy(myURLs, 0, temp, 0, myURLs.length);
                    temp[myURLs.length] = url;
                    myURLs = temp;
                }
            }
        }
        return myURLs;
    }

    public void setClassPath(String path) {
        mFinder = new ResourceFinder(toURLs(tokenize(path)), mFinder.trackOpenStreams,
                mFinder.useURLConnectionForStream);
    }

    public void addAppClassPath(String path) {
        URL[] urls = toURLs(tokenize(path));
        for (int i = 0; i < urls.length; i++) {
            URL url = urls[i];
            mFinder.addURL(url);
        }
    }

    public void addAndLoadAppClassPath(String path) {
        URL[] urls = toURLs(tokenize(path));
        for (int i = 0; i < urls.length; i++) {
            URL url = urls[i];
            mFinder.addURL(url);
            mFinder.loadClasses(url);
        }
    }

    public void addClasspathURLs(URL[] urls) {
        for (int i = 0; i < urls.length; i++) {
            mFinder.addURL(urls[i]);
        }
    }

    public static boolean addToCommonApplicationJars(String additionalClassPath) {
        URL[] urls = toURLs(tokenize(additionalClassPath));
        for (int i = 0; i < urls.length; i++) {
            URL url = urls[i];
            commonAppJarsFinder.addURL(url);
        }
        return true;
    }

    public static boolean removeFromCommonApplicationJars(String additionalClassPath) {
        URL[] urls = toURLs(tokenize(additionalClassPath));
        for (int i = 0; i < urls.length; i++) {
            URL url = urls[i];
            commonAppJarsFinder.removeURL(url);
        }
        return true;
    }

    public static URL[] getCommonApplicationJarsURLs() {
        return commonAppJarsFinder.getURLs();
    }

    /**
     * @since Pramati Server 3.0 SP 4.0
     * @deprecated use <code>getCommonApplicationJarsURLs</code>
     */
    public static List getlistOfCommonApplicationJars() {
        URL[] urls = WMUrlClassLoader.getCommonApplicationJarsURLs();
        String[] list = new String[urls.length];
        for (int i = 0; i < urls.length; i++) {
            list[i] = urls[i].getPath();
        }
        return Arrays.asList(list);
    }

    /**
     * method to load a class <bhaskar> added the flag to let the app classloader find its own version before delegating
     * to the parent. if delegation is turned off then we try to find if the class has already been loaded using
     * findClass and if not loaded, then do a findClass to find the class in our path if that too doesnot find a class
     * then we just delegate to the parent. </bhaskar>
     *
     * @param name
     * @param resolve
     * @return
     * @throws ClassNotFoundException
     */
    protected synchronized Class loadClass(String name, boolean resolve)
            throws ClassNotFoundException {
        Class c = findLoadedClass(name);
        if (c != null) {
            return c;
        }

        setInitializerClassLoader();
        try {
            if (delegateToParent || isRestrictedClass(name)) {
                return super.loadClass(name, resolve);
            } else {
                try {
                    c = findClass(name);
                } catch (ClassNotFoundException e) {
                    c = getParent().loadClass(name);
                }
                if (resolve) {
                    resolveClass(c);
                }
                return c;
            }
        } catch (ClassNotFoundException cnfe) {
            if (isInitializerClassLoader(this) && classLoaderDebugging) {
                printDebugInfoForHierarchy(this, name);
            }
            throw cnfe;
        } catch (LinkageError le) {
            if (isInitializerClassLoader(this) && classLoaderDebugging) {
                printDebugInfoForHierarchy(this, name);
            }
            throw le;
        } finally {
            if (isInitializerClassLoader(this)) {
                threadLocalForInitializerCL.set(null);
            }
        }
    }

    private boolean isRestrictedClass(String name) {
        return name.startsWith("java.") || name.startsWith("javax.");
    }

    private void setInitializerClassLoader() {
        Object isInitializer = threadLocalForInitializerCL.get();
        if (isInitializer == null) {
            threadLocalForInitializerCL.set(this);
        }
    }

    private boolean isInitializerClassLoader(ClassLoader cl) {
        return threadLocalForInitializerCL.get() == cl;
    }


    public Class findClassExternal(String name) throws ClassNotFoundException {
        Class cls = findLoadedClass(name);
        if (cls == null) {
            return findClass(name);
        }
        return cls;
    }

    protected Class findClass(String name) throws ClassNotFoundException {

        try {
            String resName = name.replace('.', '/') + ".class";
            byte[] bytes = mFinder.getBytes(resName);
            URL resourceURL = mFinder.findResource(resName);
            CodeSource codeSource = new CodeSource(resourceURL,
                    (Certificate[]) null);//todo:retrieve the certificate array associated with this class

            if (bytes == null) {
                bytes = commonAppJarsFinder.getBytes(resName);
                if (bytes == null) {
                    throw new ClassNotFoundException("Class Not Found : " + name);
                }
            }

//            bytes = transformClass(name, bytes);

            definePackageForClass(name);
            return defineClass(name, bytes, 0, bytes.length, codeSource);
        } catch (ClassNotFoundException cnfe) {
            throw cnfe;
        } catch (IOException ioe) {
            logger.error("Class not found:", ioe);
            throw new ClassNotFoundException(
                    "Class not found: " + name + " - " + ioe.getClass().getName() + ": " + ioe.getMessage());
        }
    }

    private void printDebugInfoForHierarchy(WMUrlClassLoader initializer, String name) {
        logger.debug("DUMMY", "Debug begin for class loader hierarchy for class [" + name + "]");
        logger.debug("DUMMY", "\nInitiating Classloader: " + initializer + "\n\nClass [" + name +
                "] not found in initiating Classloader :" + "\n[" + initializer.getLoaderContext() + "]"
                + "\n[Classpath searched] \n" + getTokenizedClasspath() +
                "\n\nSearch output in child Classloaders");
        List searchList = new ArrayList();
        boolean foundInChild = lookInChildren(initializer, initializer, name, searchList);
        if (!searchList.isEmpty()) {
            logger.debug("DUMMY", "Searched in: ");
            for (int i = 0; i < searchList.size(); i++) {
                logger.debug("DUMMY", "\n " + (ClassLoader) searchList.get(i));
            }
        }
        if (!foundInChild) {
            logger.debug("DUMMY", "\n\nCould not find the required classes\n\n");
        }
        logger.debug("DUMMY", "Debug end for class loader hierarchy for class [" + name + "]");
    }

    private boolean lookInChildren(WMUrlClassLoader initLoader, WMUrlClassLoader loaderNode, String name,
                                   List searchList) {
        boolean foundInChild = false;
        searchList.add(loaderNode);
        try {
            /**
             *  Avoiding searching the initiating loader twice (already searched in findClass())
             */
            if (loaderNode != initLoader) {
                WMUrlClassLoader pcl = ((WMUrlClassLoader) loaderNode);
                String resName = name.replace('.', '/') + ".class";
                String[] paths = pcl.getPathsForResource(resName);
                if (paths != null) {
                    foundInChild = true;
                    for (int i = 0; i < paths.length; i++) {
                        String sourceCodePath = paths[i];
                        logger.debug("DUMMY",
                                "\n----------------------------------------------------------------------------------------------------------------------"
                                        + "\n\nClass found in: [" + loaderNode.getLoaderContext() + "] \n" +
                                        "Class Path Entry :\n [" + sourceCodePath + "]\n" +
                                        "\n----------------------------------------------------------------------------------------------------------------------\n");
                    }
                }
            }
        } catch (Exception e) {
            logger.debug("ERROR:", e);
        }

        List childList = (((WMUrlClassLoader) loaderNode).children);
        if (childList == null || childList.size() == 0) {
            return foundInChild;
        }

        synchronized (childList) {
            Iterator itr = childList.iterator();
            while (itr.hasNext()) {
                WeakReference wr = (WeakReference) itr.next();
                Object classLoaderInstance = wr.get();
                if (classLoaderInstance == null) {
                    itr.remove();
                } else {
                    foundInChild |=
                            lookInChildren(initLoader, (WMUrlClassLoader) classLoaderInstance, name, searchList);
                }
            }
        }
        return foundInChild;
    }

    private String[] getPathsForResource(String resName) {
        List pathList = mFinder.findMultipleOccurancesOfResource(resName);
        if (pathList != null && !pathList.isEmpty()) {
            List pathStrings = new LinkedList();
            Iterator itr = pathList.listIterator();
            while (itr.hasNext()) {
                URL path = (URL) itr.next();
                try {
                    pathStrings.add(path.toURI().getPath());
                } catch (URISyntaxException e) {
                    // Move on to next URL
                }
            }
            return (String[]) pathStrings.toArray(new String[0]);
        }
        return null;
    }

    /**
     * This method defines packages for the classes Loaded by Proton URL ClassLoader. If Manifest is specified with
     * Package Information, Package is created with the given Information. If there is no manifest, a Package Object for
     * the given name is created with empty values for (Implementation version, vendor... Specification version etc.) If
     * the class Loaded has no package then the no Package Object is created.
     *
     * @param classname
     */
    private void definePackageForClass(String classname) {
        String name = "";
        int i = classname.lastIndexOf('.');
        if (i != -1) {
            name = classname.substring(0, i);
        }

        try {
            Package pkg = getPackage(name);
            if (pkg == null) {
                String resName = classname.replace('.', '/') + ".class";
                URL url = mFinder.findResourceContainer(resName);
                if (url != null) {
                    File cpEntry = new File(url.toURI().getPath());
                    if (cpEntry.isDirectory()) {
                        definePackage(name, "", "", "", "", "", "", url);
                    } else {
                        JarFile jarFile = null;
                        try {
                            jarFile = new JarFile(cpEntry);
                            Manifest man = jarFile.getManifest();
                            if (man != null) {
                                definePackage(name, man, url);
                            } else {
                                definePackage(name, "", "", "", "", "", "", url);
                            }
                        } finally {
                            if (jarFile != null) {
                                jarFile.close();
                            }
                        }
                    }
                }
            }
        } catch (URISyntaxException e) {
            logger.debug("Error while defining the package for " + name, e);
        } catch (IllegalArgumentException e) {
            logger.debug("Error while defining the package for " + name, e);
        } catch (IOException e) {
            logger.debug("Error while defining the package for " + name, e);
        }
    }

    public URL getResource(String name) {
        if (delegateToParent) {
            return super.getResource(name);
        }
        URL url = null;
        url = mFinder.findResource(name);
        if (url != null) {
            return url;
        }
        return super.getResource(name);

    }

    public synchronized InputStream getResourceAsStream(String name) {
        if (delegateToParent) {
            InputStream is = getParent().getResourceAsStream(name);
            if (is != null) {
                return is;
            } else {
                return _getResourceAsStream(name);
            }
        }

        InputStream is = _getResourceAsStream(name);
        if (is != null) {
            return is;
        } else {
            return getParent().getResourceAsStream(name);
        }
    }

    private InputStream _getResourceAsStream(String name) {
        InputStream is = null;
        try {
            is = mFinder.findResourceStream(name);
            if (is != null) {
                return is;
            }
        } catch (IOException e) {
            logger.debug("could not find file " + name, e);
        }
        return null;
    }

    protected void addURL(URL url) {
        mFinder.addURL(url);
    }

    /**
     * Returns the URLs in encoded (as per RFC2396 specification) form.
     */
    public URL[] getURLs() {
        URL[] myURLs = mFinder.getURLs();
        if (defaultURLs != null) {
            URL[] temp = new URL[defaultURLs.length + myURLs.length];
            System.arraycopy(defaultURLs, 0, temp, 0, defaultURLs.length);
            System.arraycopy(myURLs, 0, temp, defaultURLs.length, myURLs.length);
            return temp;
        } else {
            return myURLs;
        }
    }

    private static String[] tokenize(String classPathString) {
        StringTokenizer stok = new StringTokenizer(classPathString, File.pathSeparator);
        List list = new ArrayList(stok.countTokens());
        for (; stok.hasMoreTokens(); ) {
            list.add(stok.nextToken());
        }
        return (String[]) list.toArray(new String[list.size()]);
    }

    private static URL[] toURLs(String[] classPath) {
        URL[] urls = new URL[classPath.length];
        for (int i = 0; i < classPath.length; i++) {
            try {
                urls[i] = new File(classPath[i]).toURI().toURL();
            } catch (MalformedURLException e) {
                logger.error("ERROR:", e);
            }
        }
        return urls;
    }

    private static class ResourceFinder {
        private URL[] mPaths = new URL[0];
        private ResourceMap[] resourceMaps = new ResourceMap[0];

        private final Map<BufferedZipInputStream, String> openStreams = new WeakHashMap<BufferedZipInputStream,
                String>();
        private WMJarFileCache jarCache;

        protected final boolean trackOpenStreams;
        protected final boolean useURLConnectionForStream;

        public ResourceFinder(URL[] paths, boolean trackOpenStreams, boolean useURLConnectionForStream) {
            this.trackOpenStreams = trackOpenStreams;
            this.useURLConnectionForStream = useURLConnectionForStream;

            for (int i = 0; i < paths.length; i++) {
                URL path = paths[i];
                addURL(path);
            }
            if (trackOpenStreams) {
                jarCache = new WMJarFileCache();
            }
        }

        public void addURL(URL url) {
            try {
                url = encodeURL(url);
            } catch (MalformedURLException e) {
                logger.error("ERROR:", e);
                return;
            }

            // is URL already present?
            boolean contains = false;
            for (int j = 0; j < mPaths.length; j++) {
                if (url.equals(mPaths[j])) {
                    contains = true;
                    break;
                }
            }
            // if present, dont add.
            if (contains) {
                return;
            }

            URL[] dest = new URL[mPaths.length + 1];
            System.arraycopy(mPaths, 0, dest, 0, mPaths.length);
            dest[dest.length - 1] = url;
            mPaths = dest;//New mpath

            try {
                ResourceMap resMap = getResourceMap(url);
                ResourceMap[] resMaps = new ResourceMap[resourceMaps.length + 1];
                System.arraycopy(resourceMaps, 0, resMaps, 0, resourceMaps.length);
                resMaps[resMaps.length - 1] = resMap;
                resourceMaps = resMaps;//New resource maps

                URL[] urlJars = getManifestClasspathEntriesFromJar(url);
                for (int i = 0; i < urlJars.length; i++) {
                    addURL(urlJars[i]);
                }
            } catch (URISyntaxException e) {
                logger.error("ERROR:", e);
            } catch (MalformedURLException e) {
                logger.error("ERROR:", e);
            }
        }

        /**
         * Reads the URL and also the manifest entries inside it and create a new set of URLs w.r.t the manifest
         * entries.
         *
         * @param url
         * @return
         * @throws java.net.MalformedURLException
         */
        private URL[] getManifestClasspathEntriesFromJar(URL url) throws URISyntaxException, MalformedURLException {
            InputStream is = getManifest(url);
            if (is == null) {
                return new URL[0];
            }
            try {
                if (is.available() == 0) {
                    return new URL[0];
                }
            } catch (IOException e) {
                logger.info("Error in reading data", e);
                return new URL[0];
            }
            String[] jars = ManifestClasspathHelper.getJars(is);
            List al = new ArrayList();
            for (int j = 0; j < jars.length; j++) {
                if (jars[j].trim().length() > 0) {
                    URL jarUrl = resolveURL(url, jars[j]);
                    al.add(jarUrl);
                }
            }
            return (URL[]) al.toArray(new URL[al.size()]);
        }

        private InputStream getManifest(URL url) throws URISyntaxException {
            InputStream is = null;
            if (url.getProtocol().equals("file")) {
                File file = new File(url.toURI().getPath());
                if (file.isFile()) {
                    try {
                        is = JarUtils.extractEntry("META-INF/MANIFEST.MF", file.getAbsolutePath());
                    } catch (IOException e) {
                        logger.debug("Manifest file not found in jar : " + file.getAbsolutePath(), e);
                    } catch (IllegalArgumentException e) {
                        logger.debug("Manifest file not found in jar : " + file.getAbsolutePath(), e);
                    } finally {
                        if (is == null) {
                            return null;
                        }
                    }
                }
            } else {
                URLConnection connection = null;
                try {
                    connection = url.openConnection();
                } catch (IOException e) {
                    logger.info("Error in opening URL Connection", e);
                    return null;
                }
                try {
                    is = JarUtils.extractEntry("META-INF/MANIFEST.MF",
                            connection.getInputStream());
                } catch (IOException e) {
                    logger.debug("Manifest file not found in jar : " + url.toExternalForm(), e);
                } catch (IllegalArgumentException e) {
                    logger.debug("Manifest file not found in jar : " + url.toExternalForm(), e);
                } finally {
                    if (is == null) {
                        return null;
                    }
                }
            }
            return is;
        }


        private URL resolveURL(URL url, String jar) throws MalformedURLException {
            StringBuffer result = new StringBuffer();
            result.append(url.getProtocol());
            result.append(":");
            if (url.getAuthority() != null && url.getAuthority().length() > 0) {
                result.append("//");
                result.append(url.getAuthority());
            }
            if (url.getPath() != null && url.getPath().length() > 0) {
                int pos = url.getPath().lastIndexOf("/");
                String subStr = url.getPath().substring(0, pos + 1);
                result.append(subStr).append(jar);
            }
            if (url.getQuery() != null && url.getQuery().length() > 0) {
                result.append('?');
                result.append(url.getQuery());
            }
            if (url.getRef() != null && url.getRef().length() > 0) {
                result.append("#");
                result.append(url.getRef());
            }
            return new URL(result.toString());
        }

        public void removeURL(URL url) {
            try {
                url = encodeURL(url);
            } catch (MalformedURLException e) {
                logger.debug("Cannot remove URL : " + url, e);
                return;
            }
            /* remove URL from the list */
            int indx = -1;
            for (int i = 0; i < mPaths.length; i++) {
                if (mPaths[i].equals(url)) {
                    indx = i;
                    break;
                }
            }
            if (indx > -1) {
                URL[] dest = new URL[mPaths.length - 1];
                System.arraycopy(mPaths, 0, dest, 0, indx);
                System.arraycopy(mPaths, indx + 1, dest, indx, mPaths.length - indx - 1);
                mPaths = dest;
            }

            /* remove url from the resource map */
            indx = -1;
            for (int i = 0; i < resourceMaps.length; i++) {
                URL _url_ = resourceMaps[i].getURL();
                if (_url_ == null) {
                    continue;
                }
                if (_url_.equals(url)) {
                    indx = i;
                    break;
                }
            }
            if (indx > -1) {
                ResourceMap[] res = new ResourceMap[resourceMaps.length - 1];
                System.arraycopy(resourceMaps, 0, res, 0, indx);
                System.arraycopy(resourceMaps, indx + 1, res, indx, resourceMaps.length - indx - 1);
                resourceMaps = res;
            }
        }

        // gets the list of all the URLs present.
        public URL[] getURLs() {
            return mPaths;
        }

        public void loadClasses(URL url) {
            // to be implemented.
        }

        /**
         * For file protocols, the complete URL will be encoded. For other protocols, only space is encoded.
         *
         * @param url URL to be encoded
         * @return Encoded URL
         * @throws java.net.MalformedURLException If the URL cannot be formed
         */
        private URL encodeURL(URL url) throws MalformedURLException {
            if (url.toExternalForm().indexOf(" ") > 0) {
                if ("file".equals(url.getProtocol())) {
                    return new File(url.getFile()).toURI().toURL();
                } else {
                    // $FixMe$ Add support for escaping other unsafe characters.
                    return new URL(url.toExternalForm().replaceAll(" ", "%20"));
                }
            }
            return url;
        }

        private ResourceMap getResourceMap(URL path) throws URISyntaxException {
            if (path.getProtocol().equals("file")) {
                File file = new File(path.toURI().getPath());
                if (file.isDirectory()) {
                    return new DirResourceMap(file);
                } else if (file.isFile()) {
                    return new FileResourceMap(file);
                } else {
                    return new DirResourceMap(file);
                }
            } else {
                return new URLResourceMap(path);
            }
        }

        private byte[] getBytes(String resName) throws IOException, ZipException {
            for (int i = 0; i < resourceMaps.length; i++) {
                if (resourceMaps[i].contains(resName)) {
                    Resource r = resourceMaps[i].getResource(resName);
                    if (r == null) {
                        return null;
                    }
                    return r.read();
                }
            }
            return null;
        }

        private URL findResource(String resName) {
            Resource res = _findResource(resName);
            if (res == null) {
                return null;
            }
            return res.toURL();
        }

        /**
         * This method is added to return the inputstream of the found resources, which could be either FileInputStream
         * or ZipFileInputStream. This is to avoid the problem with close() of the stream return by URL.openStream().
         * jdk bug id : 4823678
         *
         * @param resName
         * @return
         * @throws java.io.IOException
         */
        private InputStream findResourceStream(String resName) throws IOException {
            Resource res = _findResource(resName);
            if (res == null) {
                return null;
            }
            return res.getInputStream();
        }

        private Resource _findResource(String resName) {
            for (int i = 0; i < resourceMaps.length; i++) {
                if (resourceMaps[i].contains(resName)) {
                    Resource r = resourceMaps[i].getResource(resName);
                    if (r == null) {
                        return null;
                    }
                    return r;
                }
            }
            return null;
        }

        private List findMultipleOccurancesOfResource(String resName) {
            List resourceList = new LinkedList();
            for (int i = 0; i < resourceMaps.length; i++) {
                if (resourceMaps[i].contains(resName)) {
                    Resource r = resourceMaps[i].getResource(resName);
                    if (r != null) {
                        resourceList.add(r.toURL());
                    }
                }
            }
            return resourceList;
        }

        private URL findResourceContainer(String resName) {
            for (int i = 0; i < resourceMaps.length; i++) {
                if (resourceMaps[i].contains(resName)) {
                    return resourceMaps[i].getURL();
                }
            }
            return null;
        }

        private Enumeration findResources(String resName) {
            List list = new ArrayList();
            for (int i = 0; i < resourceMaps.length; i++) {
                Resource[] r = resourceMaps[i].getResources(resName);
                if (r != null) {
                    list.addAll(Arrays.asList(r));
                }
            }
            final List finalList = list;
            return new Enumeration() {
                int index = -1;

                public boolean hasMoreElements() {
                    return index + 1 < finalList.size();
                }

                public Object nextElement() {
                    return ((Resource) finalList.get(++index)).toURL();
                }
            };

        }

        public String toString() {
            if (mPaths == null) {
                return "Nothing is there in the URL";
            }
            return Arrays.asList(mPaths).toString();
        }

        void addOpenStream(BufferedZipInputStream inputStream, String resName) {
            if (trackOpenStreams) {
                synchronized (openStreams) {
                    openStreams.put(inputStream, resName);
                }
            }
        }

        void removeOpenStream(BufferedZipInputStream inputStream) {
            if (trackOpenStreams) {
                synchronized (openStreams) {
                    openStreams.remove(inputStream);
                }
            }
        }


        public void close() {
            //closing open streams
            closeOpenStreams();
            //closing opened jar files
            closeOpenJars();
        }

        private void closeOpenStreams() {
            synchronized (openStreams) {
                Set<Map.Entry<BufferedZipInputStream, String>> streamEntries = openStreams.entrySet();
                for (Map.Entry<BufferedZipInputStream, String> streamEntry : streamEntries) {
                    try {
                        if (streamEntry.getKey() != null) {
                            streamEntry.getKey().closeJarFile();
                        }
                    } catch (Exception e) {
                        logger.error("Error while closing stream:", e);
                    }
                }
            }
            openStreams.clear();
        }

        private void closeOpenJars() {
            if (trackOpenStreams) {
                jarCache.close();
            }
        }

        private class PramatiJarStreamHandler
                extends URLStreamHandler {
            protected URLConnection openConnection(URL url) throws IOException {
                if (!"jar".equals(url.getProtocol())) {
                    throw new IllegalArgumentException(url.getProtocol());
                }
                return new WMJarURLConnection(url, jarCache);
            }
        }


        private class BufferedZipInputStream
                extends BufferedInputStream {

            private final ZipFile zipfile;

            public BufferedZipInputStream(InputStream in, ZipFile zipfile) {
                super(in);
                this.zipfile = zipfile;
            }

            void closeJarFile() throws IOException {
                zipfile.close();
            }

            public void close() throws IOException {
                try {
                    super.close();
                    closeJarFile();
                } finally {
                    removeOpenStream(this);
                }
            }

            protected void finalize() throws Throwable {
                close();
                super.finalize();
            }
        }

        private class FileResource
                implements Resource {
            String resName = null;
            File resContainer = null;
            boolean isArchive = false;

            FileResource(String resName, File resContainer, boolean isArchive) {
                this.resName = resName;
                this.resContainer = resContainer;
                this.isArchive = isArchive;
            }

            public InputStream getInputStream() throws IOException {
                if (useURLConnectionForStream) {
                    return toURL().openStream();
                } else {
                    return _getInputStream();
                }
            }

            private InputStream _getInputStream()
                    throws IOException {
                if (isArchive) {
                    try {
                        final ZipFile zFile = new ZipFile(resContainer);
                        BufferedZipInputStream inputStream = new BufferedZipInputStream(
                                zFile.getInputStream(zFile.getEntry(resName)), zFile);

                        if (inputStream != null) {
                            addOpenStream(inputStream, resName);
                        }
                        return inputStream;
                    } catch (IllegalArgumentException iae) {
                        logger.debug("Problem while extracting entry " + resName + " from " +
                                        resContainer.getAbsolutePath(),
                                iae);
                        throw new IOException(iae.getMessage());
                    }
                } else {
                    return new BufferedInputStream(new FileInputStream(new File(resContainer, resName)));
                }
            }

            public byte[] read() throws IOException {
                if (isArchive) {
                    try {
                        return JarUtils.extractEntryInBytes(resName, resContainer.getAbsolutePath());
                    } catch (IllegalArgumentException iae) {
                        logger.debug("Problem while extracting entry " + resName + " from " +
                                        resContainer.getAbsolutePath(),
                                iae);
                        throw new IOException(iae.getMessage());
                    }
                } else {
                    return getBytes(new File(resContainer, resName));
                }
            }

            public URL toURL() {
                try {
                    if (isArchive) {
                        if (!trackOpenStreams) {
                            return new URL("jar:" + resContainer.toURI().toURL().toString() + "!/" + resName);
                        } else {
                            return new URL("jar", null, -1, resContainer.toURI().toURL().toString() + "!/" + resName,
                                    new PramatiJarStreamHandler());
                        }
                    } else {
                        return new File(resContainer, resName).toURI().toURL();
                    }
                } catch (MalformedURLException mfe) {
                    logger.error("ERROR:", mfe);
                }
                return null;
            }

            public boolean matchesPattern(String patternName) {
                return resName.startsWith(patternName);
            }

            public String toString() {
                return toURL().toString();
            }

            public int hashCode() {
                return resContainer.hashCode();
            }

            public boolean equals(Object o) {
                if (this == o) {
                    return true;
                }
                if (o instanceof FileResource) {
                    FileResource r = (FileResource) o;
                    return resName.equals(r.resName) && resContainer.equals(r.resContainer);
                }
                return false;
            }

            private byte[] getBytes(File file) throws IOException {
                InputStream is = null;
                try {
                    is = new FileInputStream(file);
                    byte[] b = new byte[(int) file.length()];
                    int totalRead = 0;
                    while (totalRead < b.length) {
                        int read = is.read(b, totalRead, b.length - totalRead);
                        if (read < 0) {
                            break;
                        }
                        totalRead += read;
                    }
                    if (totalRead < b.length) {
                        throw new IOException("Couldn't read the file fully: " + file.getAbsolutePath());
                    }
                    return b;
                } finally {
                    if (is != null) {
                        is.close();
                    }
                }
            }
        }

        private class DirResourceMap
                implements ResourceMap {
            File dir;

            public DirResourceMap(File f) {
                dir = f;
            }

            public URL getURL() {
                try {
                    return dir.toURI().toURL();
                } catch (IOException e) {
                    logger.debug("Error while making url from path [{0}]", dir, e); // do nothing.
                }
                return null;
            }

            public Resource[] getResources(String resourcePattern) {
                List resourceList = new LinkedList();
                Resource tempRes = getResource(resourcePattern);
                if (tempRes != null) {
                    resourceList.add(tempRes);
                }

                return (Resource[]) resourceList.toArray(new Resource[0]);
            }


            public Resource getResource(String resName) {
                File f = new File(dir, resName);
                if (f.exists()) {
                    return new FileResource(resName, dir, false);
                }
                return null;
            }

            public boolean contains(String resName) {
                return new File(dir, resName).exists();
            }
        }

        private class FileResourceMap
                implements ResourceMap {

            HashMap mMap = new HashMap();
            String path;
            long timeStamp = 0;
            long loadInterval = 5 * 1000;
            long lastLoaded = 0;

            public FileResourceMap(File file) {
                path = file.getAbsolutePath();
                try {
                    loadMap(file);
                } catch (IOException e) {
                    logger.debug("Unable to load file " + file, e);
                }
            }

            public URL getURL() {
                try {
                    return new File(path).toURI().toURL();
                } catch (IOException e) {
                    logger.debug("Error while making url from path " + path, e);
                    // do nothing.
                }
                return null;
            }

            private void loadMap(File file) throws IOException {
                long currentTime = System.currentTimeMillis();
                if (currentTime - lastLoaded > loadInterval) {
                    lastLoaded = currentTime;
                    if (file.lastModified() == timeStamp) {
                        return;
                    }
                    timeStamp = file.lastModified();
                    JarFile jarFile = null;
                    try {
                        jarFile = new JarFile(file);
                        for (Enumeration jarEntriesEnum = jarFile.entries(); jarEntriesEnum.hasMoreElements(); ) {
                            JarEntry entry = (JarEntry) jarEntriesEnum.nextElement();
                            if (entry.isDirectory()) {
                                continue;
                            }
                            String name = entry.getName();
                            mMap.put(name, new FileResource(name, file, true));
                        }
                    } finally {
                        if (jarFile != null) {
                            jarFile.close();
                        }
                    }
                }
            }

            public Resource[] getResources(String resourcePattern) {
                List resourcesList = new LinkedList();
                try {
                    loadMap(new File(path));
                    Collection resources = mMap.values();
                    Iterator resourcesIterator = resources.iterator();
                    while (resourcesIterator.hasNext()) {
                        Resource resource = (Resource) resourcesIterator.next();
                        if (resource.matchesPattern(resourcePattern)) {
                            resourcesList.add(resource);
                        }
                    }
                } catch (IOException e) {
                    logger.debug("Exception while finding resources with pattern " + resourcePattern + " from " + path,
                            e);
                    return (Resource[]) resourcesList.toArray(new Resource[0]);
                }


                return (Resource[]) resourcesList.toArray(new Resource[0]);
            }

            public Resource getResource(String resName) {
                try {
                    loadMap(new File(path));
                    return (Resource) mMap.get(resName);
                } catch (IOException e) {
                    logger.debug("ERROR:", e);
                    return null;
                }
            }

            public boolean contains(String resName) {
                try {
                    loadMap(new File(path));
                    return mMap.containsKey(resName);
                } catch (IOException e) {
                    logger.debug("ERROR:", e);
                    return false;
                }
            }
        }


    }

    private static class URLResourceMap
            implements ResourceMap {
        private URL url = null;
        private HashMap mMap = new HashMap();
        private boolean isArchive = false;

        public URLResourceMap(URL path) {
            this.url = path;
            if (!url.getPath().endsWith("/")) {
                try {
                    this.isArchive = true;
                    loadMap(url);
                } catch (IOException e) {
                    logger.debug("Unable to load url : " + url.toExternalForm(), e);
                }
            }
        }

        public URL getURL() {
            return this.url;
        }

        private void loadMap(URL url) throws IOException {
            ZipInputStream zipIs = null;
            try {
                zipIs = new ZipInputStream(url.openStream());
                Hashtable ht = JarUtils.extract(zipIs);
                Iterator itr = ht.keySet().iterator();
                while (itr.hasNext()) {
                    String clzEntry = (String) itr.next();
                    clzEntry = clzEntry.replace('\\', '/');
                    mMap.put(clzEntry, new URLResource(url, clzEntry));
                }
            } finally {
                if (zipIs != null) {
                    zipIs.close();
                }
            }
        }

        public Resource getResource(String resName) {
            InputStream inputStream = null;
            try {
                if (isArchive) {
                    return (Resource) mMap.get(resName);
                } else {
                    URL tempUrl = new URL(url.toExternalForm() + resName);
                    inputStream = tempUrl.openStream();//Check it exists
                    return new URLResource(tempUrl);
                }
            } catch (MalformedURLException e) {
                logger.debug("ERROR:", e);
            } catch (IOException e) {
                logger.debug("ERROR:", e);
            } finally {
                if (inputStream != null) {
                    try {
                        inputStream.close();
                    } catch (IOException e) {
                        logger.debug("ERROR:", e);
                    }
                }
            }
            return null;
        }

        public Resource[] getResources(String resourcePattern) {
            List resourcesList = new LinkedList();
            if (isArchive) {
                Iterator resNamesItr = mMap.keySet().iterator();
                while (resNamesItr.hasNext()) {
                    String resource = (String) resNamesItr.next();
                    if (resource.indexOf(resourcePattern) > 0 || resource.equals(resourcePattern)) {
                        resourcesList.add(mMap.get(resource));
                    }
                }
                return (Resource[]) resourcesList.toArray(new Resource[resourcesList.size()]);
            } else {
                URL tempUrl = null;
                InputStream inputStream = null;
                try {
                    tempUrl = new URL(url.toExternalForm() + resourcePattern);
                    inputStream = tempUrl.openStream();
                } catch (MalformedURLException e) {
                    logger.debug("Exception while finding resources with pattern " + resourcePattern + " from " +
                                    url.toExternalForm(),
                            e);
                    return new Resource[0];
                } catch (IOException e) {
                    logger.debug("Exception while finding resources with pattern " + resourcePattern + " from " +
                                    url.toExternalForm(),
                            e);
                    return new Resource[0];
                } finally {
                    if (inputStream != null) {
                        try {
                            inputStream.close();
                        } catch (IOException e) {
                            logger.debug("ERROR:", e);
                        }
                    }
                }
                return new Resource[]{new URLResource(tempUrl)};
            }
        }

        public boolean contains(String resName) {
            if (isArchive) {
                return mMap.containsKey(resName);
            } else {
                try {
                    URL tempUrl = new URL(url.toExternalForm() + resName);
                    tempUrl.openStream();
                    return true;
                } catch (IOException e) {
                    logger.debug("ERROR:", e);
                    return false;
                }
            }
        }
    }

    private static class URLResource
            implements Resource {
        private URL url = null;
        private String resName = null;

        public URLResource(URL url) {
            this.url = url;
        }

        public URLResource(URL url, String resName) {
            this.url = url;
            this.resName = resName;
        }

        public InputStream getInputStream() throws IOException {
            return url.openStream();
        }

        public byte[] read() throws IOException {
            InputStream is = url.openStream();
            if (resName != null) {
                return JarUtils.extractEntryInBytes(resName, is);
            }
            ByteArrayOutputStream baos;
            try {
                baos = new ByteArrayOutputStream();
                byte[] buf = new byte[2048];
                int read = is.read(buf);
                while (read > 0) {
                    baos.write(buf, 0, read);
                    read = is.read(buf);
                }
            } finally {
                if (is != null) {
                    is.close();
                }
            }
            return baos.toByteArray();
        }

        public boolean matchesPattern(String patternName) {
            return url.getFile().startsWith(patternName);
        }

        public URL toURL() {
            return url;
        }
    }

    private static interface ResourceMap {
        public static final String ALL_RESOURCES = "*";

        public Resource getResource(String resName);

        /**
         * Gets all the resources matching the resource pattern provided.
         *
         * @param resourcePattern The pattern based on which the resources are selected.A "*" should mean all the
         *                        resources.
         * @return Array of all the resources satisfying the pattern.
         */
        public Resource[] getResources(String resourcePattern);

        public boolean contains(String resName);

        public URL getURL();
    }

    private static interface Resource {
        InputStream getInputStream() throws IOException;

        byte[] read() throws IOException;

        boolean matchesPattern(String patternName);

        URL toURL();
    }
}
