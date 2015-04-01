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

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.type.ClassKey;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.fasterxml.jackson.databind.util.LRUMap;
import com.mysql.jdbc.AbandonedConnectionCleanupThread;
import com.sun.naming.internal.ResourceManager;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.studio.common.util.CastUtils;
import org.apache.commons.logging.LogFactory;
import org.hsqldb.DatabaseManager;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import java.beans.Introspector;
import java.lang.reflect.Field;
import java.sql.Driver;
import java.sql.DriverManager;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.ResourceBundle;
import java.util.WeakHashMap;

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
        if (DatabaseManager.class.getClassLoader() == CleanupListener.class.getClassLoader()) {//Shutdown the thread only if the class is loaded by web-app
            try {
                if (DatabaseManager.getTimer() != null) {
                    DatabaseManager.getTimer().shutDown();
                    if (DatabaseManager.getTimer().getThread().isAlive()) {
                        System.out.println("Joining HSQL-Timer thread: " + DatabaseManager.getTimer().getThread().getName());
                        DatabaseManager.getTimer().getThread().join();
                    }
                }
            } catch (NullPointerException e) {
                System.out.println("No active HSQL-Timer thread found");
            } catch (Throwable e) {
                System.out.println("Failed to shutdown HSQL-Timer thread");
                e.printStackTrace();
            }
        }
    }

    /**
     * Added by akritim on 3/23/2015.
     * To stop mysql thread, if any and resolve issue of "Abandoned connection cleanup thread" not stopping
     */
    private void shutDownMySQLThreadIfAny() {
        if (AbandonedConnectionCleanupThread.class.getClassLoader() == CleanupListener.class.getClassLoader()) {//Shutdown the thread only if the class is loaded by web-app
            try {
                AbandonedConnectionCleanupThread.shutdown();
            } catch (Throwable e) {
                System.out.println("Failed to shutdown My SQL thread");
                e.printStackTrace();
            }
        }
    }

    /**
     * Added by akritim on 3/28/2015.
     * To clear TypeFactory's TypeCache
     */
    private void TypeFactoryClearTypeCache() {
        try {
            Field typeCache = TypeFactory.class.getDeclaredField("_typeCache");
            typeCache.setAccessible(true);
            LRUMap<ClassKey, JavaType> cache = (LRUMap<ClassKey, JavaType>) typeCache.get(TypeFactory.defaultInstance());
            if (cache != null) {
                cache.clear();
            }
        } catch (NullPointerException e) {
            System.out.println("No active TypeCache To clear");
        } catch (Throwable e) {
            System.out.println("Failed to ClearTypeCache from TypeFactory");
            e.printStackTrace();
        }
    }

    /**
     * Added by akritim on 3/28/2015.
     * To clear TypeFactory's TypeCache
     */
    private void ResouceManagerClearPropertiesCache() {
        if(ResourceManager.class.getClassLoader() == CleanupListener.class.getClassLoader()){
            try {
                Field propertiesCache = ResourceManager.class.getDeclaredField("propertiesCache");
                propertiesCache.setAccessible(true);
                WeakHashMap<Object, Hashtable<? super String, Object>> map = (WeakHashMap<Object, Hashtable<? super String, Object>>) propertiesCache.get(null);
                if (map != null) {
                    map.clear();
                }
            } catch (NullPointerException e) {
                System.out.println("No active propertiesCache To clear");
            } catch (Throwable e) {
                System.out.println("Failed to clear propertiesCache from ResouceManager");
                e.printStackTrace();
            }

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
