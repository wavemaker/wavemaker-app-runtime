/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.server;

import java.beans.Introspector;
import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.PlatformManagedObject;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Vector;
import java.util.WeakHashMap;

import javax.management.InstanceNotFoundException;
import javax.management.MBeanRegistrationException;
import javax.management.MBeanServer;
import javax.management.MalformedObjectNameException;
import javax.management.NotificationEmitter;
import javax.management.NotificationListener;
import javax.management.ObjectName;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.commons.lang3.ClassUtils;
import org.apache.commons.logging.LogFactory;
import org.apache.poi.xssf.usermodel.XSSFPicture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.ReflectionUtils;

import com.fasterxml.jackson.databind.type.TypeFactory;
import com.sun.jndi.ldap.Connection;
import com.sun.jndi.ldap.LdapClient;
import com.sun.jndi.ldap.LdapPoolManager;
import com.sun.naming.internal.ResourceManager;
import com.sun.org.apache.xml.internal.resolver.Catalog;
import com.sun.org.apache.xml.internal.resolver.CatalogManager;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.classloader.ClassLoaderUtils;
import com.wavemaker.commons.util.WMIOUtils;
import com.wavemaker.commons.util.WMUtils;

/**
 * Listener that flushes all of the Introspector's internal caches and de-registers all JDBC drivers on web app
 * shutdown.
 *
 * @author Frankie Fu
 * @author akritim
 */
public class CleanupListener implements ServletContextListener {

    private static final Logger logger = LoggerFactory.getLogger(CleanupListener.class);

    private boolean isSharedLib() {
        return WMUtils.isSharedLibSetup();
    }

    @Override
    public void contextInitialized(ServletContextEvent event) {
        //properties set to time out LDAP connections automatically
        System.setProperty("com.sun.jndi.ldap.connect.pool.timeout", "2000");
        System.setProperty("ldap.connection.com.sun.jndi.ldap.read.timeout", "1000");
        warmUpPoiInParentClassLoader();
    }

    /*
        In XSSFPicture, while creating prototype it internally using current app class loader references, due to this
         app classloader was not cleared event after app undeploy.
        To fix memory leak caused by first time initialization from Web app, We are loading prototype through
        common class loader.
     */
    private void warmUpPoiInParentClassLoader() {
        try {
            ClassLoader currentCL = Thread.currentThread().getContextClassLoader();
            if (currentCL != XSSFPicture.class.getClassLoader()) {
                try {
                    Thread.currentThread().setContextClassLoader(XSSFPicture.class.getClassLoader());
                    logger.info("warming up poi prototype field");
                    final Method prototype = XSSFPicture.class.getDeclaredMethod("prototype");
                    prototype.setAccessible(true);
                    prototype.invoke(null);
                } finally {
                    Thread.currentThread().setContextClassLoader(currentCL);
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to initialize prototype method", e);
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent event) {
        try {
            /**
             * De registering it at the start so that preceding clean up tasks may clean any references created by loading unwanted classes by this call.
             */
            deregisterDrivers();
            //Release references that are not being closed automatically by libraries
            shutDownHSQLTimerThreadIfAny();
            shutDownMySQLThreadIfAny();
            deRegisterOracleDiagnosabilityMBean();
            typeFactoryClearTypeCache();
            resourceManagerClearPropertiesCache();
            clearReaderArrCatalogManager();
            //clearCacheSourceAbstractClassGenerator();
            clearThreadConnections();
            cleanupMBeanNotificationListeners();
            cleanupJULIReferences();

            //Release all open references for logging
            LogFactory.release(this.getClass().getClassLoader());

            // flush all of the Introspector's internal caches
            Introspector.flushCaches();
            logger.info("Clean Up Successful!");
        } catch (Exception e) {
            logger.info("Failed to clean up some things on app undeploy", e);
        }
    }

    /**
     * Added by akritim
     * To stop HSQL timer thread, if any
     */
    private void shutDownHSQLTimerThreadIfAny() {
        String className = "org.hsqldb.DatabaseManager";
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            if (klass != null && klass.getClassLoader() == this.getClass().getClassLoader()) {
                //Shutdown the thread only if the class is loaded by web-app
                final Class<?> databaseManagerClass = ClassUtils.getClass("org.hsqldb.DatabaseManager");
                final Class<?> hsqlTimerClass = ClassUtils.getClass("org.hsqldb.lib.HsqlTimer");

                Method timerMethod = databaseManagerClass.getMethod("getTimer");

                Object timerObj = timerMethod.invoke(null);
                if (timerObj != null) {
                    hsqlTimerClass.getMethod("shutDown").invoke(timerObj);

                    Thread hsqlTimerThread = (Thread) hsqlTimerClass.getMethod("getThread").invoke(timerObj);
                    if (hsqlTimerThread != null && hsqlTimerThread.isAlive()) {
                        logger.info("Joining HSQL-Timer thread: {}", hsqlTimerThread.getName());
                        hsqlTimerThread.join(2000);
                    }
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to shutdown hsql timer thread {}", className, e);
        }
    }

    /**
     * Added by akritim
     * To stop mysql thread, if any and resolve issue of "Abandoned connection cleanup thread" not stopping
     */
    private void shutDownMySQLThreadIfAny() {
        String className = "com.mysql.jdbc.AbandonedConnectionCleanupThread";
        try {
            Class<?> klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(),
                    className);
            if (klass != null && klass.getClassLoader() == this.getClass().getClassLoader()) {
                //Shutdown the thread only if the class is loaded by web-app
                logger.info("Shutting down mysql AbandonedConnectionCleanupThread");
                klass.getMethod("shutdown").invoke(null);
            }
        } catch (Throwable e) {
            logger.warn("Failed to shutdown mysql thread {}", className, e);
        }
    }

    /**
     * De Registers the mbean registered by the oracle driver
     */
    private void deRegisterOracleDiagnosabilityMBean() {
        final ClassLoader cl = Thread.currentThread().getContextClassLoader();
        String mBeanName = cl.getClass().getName() + "@" + Integer.toHexString(cl.hashCode());
        try {
            try {
                deRegisterOracleDiagnosabilityMBean(mBeanName);
            } catch (InstanceNotFoundException e) {
                logger.debug("Oracle OracleDiagnosabilityMBean {} not found", mBeanName, e);
                //Trying with different mBeanName as some versions of oracle driver uses the second formula for mBeanName
                mBeanName = cl.getClass().getName() + "@" + Integer.toHexString(cl.hashCode()).toLowerCase();
                try {
                    deRegisterOracleDiagnosabilityMBean(mBeanName);
                } catch (InstanceNotFoundException e1) {
                    logger.debug("Oracle OracleDiagnosabilityMBean {} also not found", mBeanName, e);
                }
            }
        } catch (Throwable e) {
            logger.error("Oracle JMX unregistration error", e);
        }
    }

    private void deRegisterOracleDiagnosabilityMBean(
            String nameValue) throws InstanceNotFoundException, MBeanRegistrationException, MalformedObjectNameException {
        final MBeanServer mbs = ManagementFactory.getPlatformMBeanServer();
        final Hashtable<String, String> keys = new Hashtable<>();
        keys.put("type", "diagnosability");
        keys.put("name", nameValue);
        mbs.unregisterMBean(new ObjectName("com.oracle.jdbc", keys));
        logger.info("Deregistered OracleDiagnosabilityMBean {}", nameValue);
    }

    /**
     * Clears any notification listeners registered with memory mx bean
     */
    private void cleanupMBeanNotificationListeners() {
        cleanupNotificationListener(ManagementFactory.getMemoryMXBean());
        List<GarbageCollectorMXBean> garbageCollectorMXBeans = ManagementFactory.getGarbageCollectorMXBeans();
        for (GarbageCollectorMXBean garbageCollectorMXBean : garbageCollectorMXBeans) {
            cleanupNotificationListener(garbageCollectorMXBean);
        }
    }

    private void cleanupNotificationListener(PlatformManagedObject platformManagedObject) {
        try {
            NotificationEmitter notificationEmitter = (NotificationEmitter) platformManagedObject;
            Field listenerListField = ReflectionUtils.findField(notificationEmitter.getClass(), "listenerList");
            if (listenerListField == null) {
                throw new WMRuntimeException(
                        "Unrecognized NotificationEmitter class " + notificationEmitter.getClass().getName());
            }
            listenerListField.setAccessible(true);
            List listenerInfoList = (List) listenerListField
                    .get(notificationEmitter);//This object would be List<ListenerInfo>
            for (Object o : listenerInfoList) {
                Field listenerField = o.getClass().getDeclaredField("listener");
                if (listenerListField == null) {
                    throw new WMRuntimeException("Unrecognized ListenerInfo class " + o.getClass().getName());
                }
                listenerField.setAccessible(true);
                NotificationListener notificationListener = (NotificationListener) listenerField.get(o);
                if (notificationListener.getClass().getClassLoader() == Thread.currentThread()
                        .getContextClassLoader()) {
                    logger.info("Removing registered mBean notification listener {}",
                            notificationListener.getClass().getName());
                    notificationEmitter.removeNotificationListener(notificationListener);
                }
            }
        } catch (Exception e) {
            String className = "oracle.jdbc.driver.BlockSource";
            Class loadedClass = null;
            try {
                loadedClass = ClassLoaderUtils
                        .findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            } catch (Exception e1) {
                logger.warn("Failed to find loaded class for class {}", className, e1);
            }
            if (loadedClass == null) {
                logger.info(
                        "MBean clean up is not successful, any uncleared notification listeners might create a memory leak");
                logger.trace("Exception Stack trace", e);
            } else {
                logger.warn(
                        "MBean clean up is not successful, any uncleared notification listeners might create a memory leak",
                        e);
            }
        }
    }

    /**
     * Clears up the references for the TCL in java.util.Logging.Level$KnownLevel class
     */
    private void cleanupJULIReferences() {
        String className = "java.util.logging.Level$KnownLevel";
        try {
            Class klass = Class.forName(className, true, Thread.currentThread().getContextClassLoader());
            Field nameToKnownLevelsField = klass.getDeclaredField("nameToLevels");
            Field intToKnownLevelsField = klass.getDeclaredField("intToLevels");
            Field levelObjectField = klass.getDeclaredField("levelObject");
            Field mirroredLevelField = klass.getDeclaredField("mirroredLevel");
            nameToKnownLevelsField.setAccessible(true);
            intToKnownLevelsField.setAccessible(true);
            levelObjectField.setAccessible(true);
            mirroredLevelField.setAccessible(true);
            synchronized (klass) {
                Map<Object, List> nameToKnownLevels = (Map<Object, List>) nameToKnownLevelsField.get(null);
                removeTCLKnownLevels(nameToKnownLevels, levelObjectField, mirroredLevelField);

                Map<Object, List> intToKnownLevels = (Map<Object, List>) intToKnownLevelsField.get(null);
                removeTCLKnownLevels(intToKnownLevels, levelObjectField, mirroredLevelField);

            }
        } catch (Exception e) {
            logger.warn("Failed to clean up juli references in the class " + className, e);
        }
    }

    private void removeTCLKnownLevels(
            Map<Object, List> nameToKnownLevels, Field levelObjectField,
            Field mirroredLevelField) throws NoSuchFieldException, IllegalAccessException {
        Set<Map.Entry<Object, List>> entrySet = nameToKnownLevels.entrySet();
        Iterator<Map.Entry<Object, List>> mapEntryIterator = entrySet.iterator();
        while (mapEntryIterator.hasNext()) {
            Map.Entry<Object, List> entry = mapEntryIterator.next();
            List knownLevels = entry.getValue();
            Iterator iterator = knownLevels.iterator();
            List<Object> removableMirroredObjects = new ArrayList<>();
            while (iterator.hasNext()) {
                Object knownLevelObject = iterator.next();
                Object levelObject = levelObjectField.get(knownLevelObject);
                if (levelObject.getClass().getClassLoader() == Thread.currentThread().getContextClassLoader()) {
                    iterator.remove();
                    removableMirroredObjects.add(mirroredLevelField.get(knownLevelObject));
                }
            }
            iterator = knownLevels.iterator();
            while (iterator.hasNext()) {
                Object knownLevelObject = iterator.next();
                Object levelObject = levelObjectField.get(knownLevelObject);
                if (removableMirroredObjects.contains(levelObject)) {
                    iterator.remove();
                }
            }
            if (knownLevels.isEmpty()) {
                mapEntryIterator.remove();
            }
        }
    }

    /**
     * Added by akritim
     * To clear TypeFactory's TypeCache
     */
    private void typeFactoryClearTypeCache() {
        if (isSharedLib()) {
            String className = "com.fasterxml.jackson.databind.type.TypeFactory";
            try {
                Class klass = ClassLoaderUtils
                        .findLoadedClass(Thread.currentThread().getContextClassLoader().getParent(), className);
                if (klass != null) {
                    logger.info("Attempt to clear typeCache from {} class instance", klass);
                    TypeFactory.defaultInstance().clearCache();
                }
            } catch (Throwable e) {
                logger.warn("Failed to Clear TypeCache from {}", className, e);
            }
        }
    }

    /**
     * Added by akritim
     * To clear ReaderArr in CatalogManager
     */
    private void clearReaderArrCatalogManager() {
        try {
            logger.info("Attempt to clear readerArr field of type Vector from class {}", Catalog.class);
            Catalog catalog = CatalogManager.getStaticManager().getCatalog();
            Field readerArrField = Catalog.class.getDeclaredField("readerArr");
            readerArrField.setAccessible(true);
            Vector reader = (Vector) readerArrField.get(catalog);
            if (reader != null) {
                reader.clear();
            }
        } catch (Throwable e) {
            logger.warn("Failed to clear readArr from catalog", e);
        }
    }

    /**
     * Added by akritim
     * To clear ResourceManager's PropertiesCache
     */
    private void resourceManagerClearPropertiesCache() {
        Class<ResourceManager> klass = ResourceManager.class;
        try {
            Field propertiesCache = klass.getDeclaredField("propertiesCache");
            propertiesCache.setAccessible(true);
            WeakHashMap<Object, Hashtable<? super String, Object>> map = (WeakHashMap<Object, Hashtable<? super String, Object>>) propertiesCache
                    .get(null);
            if (!map.isEmpty()) {
                logger.info("Clearing propertiesCache from ");
                map.clear();
            }
        } catch (Throwable e) {
            logger.warn("Failed to clear propertiesCache from {}", klass, e);
        }
    }

    /**
     * Added by akritim
     * To clear cache from AbtractClassGenerator's Source
     */
    /*private void clearCacheSourceAbstractClassGenerator() {
        if (isSharedLib()) {
            try {
                String className = "org.springframework.cglib.core.AbstractClassGenerator$Source";
                logger.info("Attempt to clear cache field from class {}", className);
                Field SOURCE = Enhancer.class.getDeclaredField("SOURCE");
                SOURCE.setAccessible(true);
                SOURCE.get(null);
                Field cache = org.springframework.cglib.core.AbstractClassGenerator.class.getClassLoader()
                        .loadClass(className).getDeclaredField("cache");
                cache.setAccessible(true);
                Map map = (Map) cache.get(SOURCE.get(null));
                map.remove(CleanupListener.class.getClassLoader());
            } catch (Throwable e) {
                logger.warn("Failed to Clear Cache from Source", e);
            }
        }
    }*/
    private void clearThreadConnections() {
        Set<Thread> threads = Thread.getAllStackTraces().keySet();
        for (Thread thread : threads) {
            if (thread.isAlive() && !(thread == Thread.currentThread()) &&
                    (thread.getContextClassLoader() == Thread.currentThread().getContextClassLoader())) {
                try {
                    if (thread.getName().startsWith("Thread-")) {
                        Field targetField = Thread.class.getDeclaredField("target");
                        targetField.setAccessible(true);
                        Runnable runnable = (Runnable) targetField.get(thread);
                        if (runnable != null && runnable instanceof Connection) {
                            logger.info("Interrupting LDAP connection thread");
                            Connection conn = (Connection) runnable;
                            WMIOUtils.closeSilently(conn.inStream);
                            WMIOUtils.closeSilently(conn.outStream);
                            Field parent = Connection.class.getDeclaredField("parent");
                            parent.setAccessible(true);
                            LdapClient ldapClient = (LdapClient) parent.get(conn);
                            ldapClient.closeConnection();
                            LdapPoolManager.expire(3000);
                            if (!thread.isInterrupted()) {
                                thread.stop();
                            }
                        }
                    }
                } catch (Throwable t) {
                    logger.warn("Failed to stop the thread {} properly", thread, t);
                }
            }
        }
    }

    /**
     * de-registers the JDBC drivers registered visible to this class loader from DriverManager
     * Added by akritim
     */
    private void deregisterDrivers() {
        try {

            /*
             * DriverManager.getDrivers() has the side effect of registering driver classes
             * which are there in other class loaders(and registered with DriverManager) but not yet loaded in the caller class loader.
             * So calling it twice so that the second call to getDrivers will actually return all the drivers visible to the caller class loader.
             * Synchronizing the process to prevent a rare case where the second call to getDrivers method actually registers the unwanted driver
             * because of registerDriver from some other thread between the two getDrivers call
            */
            Enumeration<Driver> drivers;
            synchronized (DriverManager.class) {
                Enumeration<Driver> ignoreDrivers = DriverManager.getDrivers();
                drivers = DriverManager.getDrivers();
            }
            while (drivers.hasMoreElements()) {
                Driver driver = drivers.nextElement();
                if (driver.getClass().getClassLoader() == getClass().getClassLoader()) {
                    logger.info("De Registering the driver {}", driver.getClass().getCanonicalName());
                    try {
                        DriverManager.deregisterDriver(driver);
                    } catch (SQLException e1) {
                        logger.warn("Failed to de-register driver ", driver.getClass().getCanonicalName(), e1);
                    }
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to de-register drivers", e);
        }
    }
}
