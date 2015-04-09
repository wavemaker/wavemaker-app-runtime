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
package com.wavemaker.runtime.server;

import java.beans.Introspector;
import java.lang.reflect.Field;
import java.sql.Driver;
import java.sql.DriverManager;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Map;
import java.util.WeakHashMap;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.commons.logging.LogFactory;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.studio.common.classloader.ClassLoaderUtils;
import com.wavemaker.studio.common.util.CastUtils;

/**
 * Listener that flushes all of the Introspector's internal caches and de-registers all JDBC drivers on web app
 * shutdown.
 *
 * @author Frankie Fu
 */
public class CleanupListener implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent event) {
        WMAppContext.getInstance(event);
    }

    @Override
    public void contextDestroyed(ServletContextEvent event) {
        try {
            shutDownHSQLTimerThreadIfAny();
            shutDownMySQLThreadIfAny();
            TypeFactoryClearTypeCache();

            // shutDownAnyOtherThreads();

            // remove from the system DriverManager the JDBC drivers registered
            // by this web app
            /** Adding this line as getDrivers has a side effect of registering drivers
             * that are visible to this class loader but haven't yet been loaded and the newly registered
             * drivers are not returned in the call,therefore calling
             * DriverManager.getDriviers() twice to get the full list including the newly registered drivers
             **/
            Enumeration<Driver> ignoreDrivers = DriverManager.getDrivers();
            for (Enumeration<Driver> e = CastUtils.cast(DriverManager.getDrivers()); e.hasMoreElements(); ) {
                Driver driver = e.nextElement();
                if (driver.getClass().getClassLoader() == getClass().getClassLoader()) {
                    System.out.println("De Registering the driver [" + driver.getClass().getCanonicalName() + "]");
                    DriverManager.deregisterDriver(driver);
                }
            }

            //Release all open references for logging
            LogFactory.release(this.getClass().getClassLoader());

            // flush all of the Introspector's internal caches
            Introspector.flushCaches();

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            WMAppContext.clearInstance();
            System.out.println("Clean Up Completed!");
        }
    }

    private void shutDownHSQLTimerThreadIfAny() {
        String className = "org.hsqldb.DatabaseManager";
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            if (klass != null && klass.getClassLoader() == CleanupListener.class.getClassLoader()) {//Shutdown the thread only if the class is loaded by web-app
                Object hsqlTimer = klass.getMethod("getTimer").invoke(null);
                if (hsqlTimer != null) {
                    hsqlTimer.getClass().getMethod("shutDown").invoke(hsqlTimer);
                    Thread hsqlTimerThread = (Thread) hsqlTimer.getClass().getMethod("getThread").invoke(hsqlTimer);
                    if (hsqlTimerThread != null && hsqlTimerThread.isAlive()) {
                        System.out.println("Joining HSQL-Timer thread: " + hsqlTimerThread.getName());
                        hsqlTimerThread.join();
                    }
                }
            }
        } catch (Throwable e) {
            System.out.println("Failed to shutdown hsql timer thread " + className);
            e.printStackTrace();
        }
    }

    /**
     * Added by akritim on 3/23/2015.
     * To stop mysql thread, if any and resolve issue of "Abandoned connection cleanup thread" not stopping
     */
    private void shutDownMySQLThreadIfAny() {
        String className = "com.mysql.jdbc.AbandonedConnectionCleanupThread";
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            if (klass != null && klass.getClassLoader() == CleanupListener.class.getClassLoader()) {//Shutdown the thread only if the class is loaded by web-app
                klass.getMethod("shutdown").invoke(null);
            }
        } catch (Throwable e) {
            System.out.println("Failed to shutdown mysql thread " + className);
            e.printStackTrace();
        }
    }

    /**
     * Added by akritim on 3/28/2015.
     * To clear TypeFactory's TypeCache
     */
    private void TypeFactoryClearTypeCache() {
        String className = "com.fasterxml.jackson.databind.type.TypeFactory";
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            if (klass != null) {
                Object defaultInstance = klass.getMethod("defaultInstance").invoke(null);
                Field typeCache = klass.getDeclaredField("_typeCache");
                typeCache.setAccessible(true);
                Map cache = (Map) typeCache.get(defaultInstance);
                if (cache != null) {
                    cache.clear();
                }
            }
        } catch (Throwable e) {
            System.out.println("Failed to Clear TypeCache from " + className);
            e.printStackTrace();
        }
    }

    /**
     * Added by akritim on 3/28/2015.
     * To clear TypeFactory's TypeCache
     */
    private void ResourceManagerClearPropertiesCache() {
        String className = "com.sun.naming.internal.ResourceManager";
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            if(klass != null && klass.getClassLoader() == CleanupListener.class.getClassLoader()){
                Field propertiesCache = klass.getDeclaredField("propertiesCache");
                propertiesCache.setAccessible(true);
                WeakHashMap<Object, Hashtable<? super String, Object>> map = (WeakHashMap<Object, Hashtable<? super String, Object>>) propertiesCache.get(null);
                if (map != null) {
                    map.clear();
                }
            }
        } catch (Throwable e) {
            System.out.println("Failed to clear propertiesCache from " + className);
            e.printStackTrace();
        }
    }


    /*private void shutDownAnyOtherThreads() throws InterruptedException {
        Set<Thread> threads = Thread.getAllStackTraces().keySet();
        for(Thread thread : threads) {
            if(thread.isAlive() && !(thread == Thread.currentThread())
                    && thread.getContextClassLoader() == CleanupListener.class.getClassLoader()) {
                System.out.println(new Date() + ":Waiting for clean up of thread [" + thread.getName() + "]");
                thread.join(20000);//Waiting for 20 seconds for all the cleanup threads to be cleared
                if(!thread.isAlive()) {
                    System.out.println(new Date() +":Thread [" + thread.getName() + "] got dead");
                } else {
                    System.out.println(new Date() +":Thread [" + thread.getName() + "] is still alive");
                }
            }
        }
    }*/
}
