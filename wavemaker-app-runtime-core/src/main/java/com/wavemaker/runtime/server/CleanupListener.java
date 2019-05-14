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
import java.security.Provider;
import java.security.Security;
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
import java.util.WeakHashMap;
import java.util.stream.Collectors;

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

    private static final Logger logger = LoggerFactory.getLogger(CleanupListener.class);;
    
    private static final int MAX_WAIT_TIME_FOR_RUNNING_THREADS = Integer.getInteger("wm.app.maxWaitTimeRunningThreads", 5000); 

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
            ClassLoader currentCL = getAppClassLoader();
            if (currentCL != XSSFPicture.class.getClassLoader()) {
                try {
                    Thread.currentThread().setContextClassLoader(XSSFPicture.class.getClassLoader());
                    logger.info("warming up poi prototype field");
                    final Method prototype = findMethod(XSSFPicture.class, "prototype");
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
            deregisterDrivers(getAppClassLoader());
            deRegisterOracleDiagnosabilityMBean(getAppClassLoader());
            typeFactoryClearTypeCache(getAppClassLoader());
            resourceManagerClearPropertiesCache();
            //clearCacheSourceAbstractClassGenerator();
            clearLdapThreadConnections(getAppClassLoader());
            cleanupMBeanNotificationListeners(getAppClassLoader());
            cleanupJULIReferences(getAppClassLoader());
            deregisterSecurityProviders(getAppClassLoader());
            stopRunningThreads(getAppClassLoader(), MAX_WAIT_TIME_FOR_RUNNING_THREADS);
            //Release all open references for logging
            LogFactory.release(getAppClassLoader());

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
    private static void shutDownHSQLTimerThreadIfAny(ClassLoader classLoader) {
        String className = "org.hsqldb.DatabaseManager";
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(classLoader, className);
            if (klass != null && klass.getClassLoader() == classLoader) {
                //Shutdown the thread only if the class is loaded by web-app
                final Class<?> databaseManagerClass = ClassUtils.getClass("org.hsqldb.DatabaseManager");
                final Class<?> hsqlTimerClass = ClassUtils.getClass("org.hsqldb.lib.HsqlTimer");

                Method timerMethod = databaseManagerClass.getMethod("getTimer");

                Object timerObj = timerMethod.invoke(null);
                if (timerObj != null) {
                    hsqlTimerClass.getMethod("shutDown").invoke(timerObj);
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
    private static void shutDownMySQLThreadIfAny(ClassLoader classLoader) {
        String className = "com.mysql.jdbc.AbandonedConnectionCleanupThread";
        try {
            Class<?> klass = ClassLoaderUtils.findLoadedClass(classLoader, className);
            if (klass != null && klass.getClassLoader() == classLoader) {
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
    public static void deRegisterOracleDiagnosabilityMBean(ClassLoader classLoader) {
        String mBeanName = classLoader.getClass().getName() + "@" + Integer.toHexString(classLoader.hashCode());
        try {
            try {
                deRegisterOracleDiagnosabilityMBean(mBeanName);
            } catch (InstanceNotFoundException e) {
                logger.debug("Oracle OracleDiagnosabilityMBean {} not found", mBeanName, e);
                //Trying with different mBeanName as some versions of oracle driver uses the second formula for mBeanName
                mBeanName = classLoader.getClass().getName() + "@" + Integer.toHexString(classLoader.hashCode()).toLowerCase();
                try {
                    deRegisterOracleDiagnosabilityMBean(mBeanName);
                } catch (InstanceNotFoundException e1) {
                    logger.debug("Oracle OracleDiagnosabilityMBean {} also not found", mBeanName);
                }
            }
        } catch (Throwable e) {
            logger.error("Oracle JMX unregistration error", e);
        }
    }

    private static void deRegisterOracleDiagnosabilityMBean(String nameValue) 
            throws InstanceNotFoundException, MBeanRegistrationException, MalformedObjectNameException {
        final MBeanServer mbs = ManagementFactory.getPlatformMBeanServer();
        final Hashtable<String, String> keys = new Hashtable<>();
        keys.put("type", "diagnosability");
        keys.put("name", nameValue);
        mbs.unregisterMBean(new ObjectName("com.oracle.jdbc", keys));
        logger.info("Deregistered OracleDiagnosabilityMBean {}", nameValue);
    }

    /**
     * Clears any notification listeners registered with memory mx bean
     * For example Oracle's BlockSource creates an mbean listener which needs to be deregistered
     */
    public static void cleanupMBeanNotificationListeners(ClassLoader classLoader) {
        cleanupNotificationListener(classLoader, ManagementFactory.getMemoryMXBean());
        List<GarbageCollectorMXBean> garbageCollectorMXBeans = ManagementFactory.getGarbageCollectorMXBeans();
        for (GarbageCollectorMXBean garbageCollectorMXBean : garbageCollectorMXBeans) {
            cleanupNotificationListener(classLoader, garbageCollectorMXBean);
        }
    }

    private static void cleanupNotificationListener(ClassLoader classLoader, PlatformManagedObject platformManagedObject) {
        try {
            NotificationEmitter notificationEmitter = (NotificationEmitter) platformManagedObject;
            Field listenerListField = findField(notificationEmitter.getClass(), "listenerList");
            if (listenerListField == null) {
                throw new WMRuntimeException("Unrecognized NotificationEmitter class " + notificationEmitter.getClass().getName());
            }
            List listenerInfoList = (List) listenerListField.get(notificationEmitter);//This object would be List<ListenerInfo>
            for (Object o : listenerInfoList) {
                Field listenerField = findField(o.getClass(), "listener");
                if (listenerListField == null) {
                    throw new WMRuntimeException("Unrecognized ListenerInfo class " + o.getClass().getName());
                }
                NotificationListener notificationListener = (NotificationListener) listenerField.get(o);
                if (notificationListener.getClass().getClassLoader() == classLoader) {
                    logger.info("Removing registered mBean notification listener {}", notificationListener.getClass().getName());
                    notificationEmitter.removeNotificationListener(notificationListener);
                }
            }
        } catch (Exception e) {
            String className = "oracle.jdbc.driver.BlockSource";
            Class loadedClass = null;
            try {
                loadedClass = ClassLoaderUtils.findLoadedClass(classLoader, className);
            } catch (Exception e1) {
                logger.warn("Failed to find loaded class for class {}", className, e1);
            }
            if (loadedClass == null) {
                logger.info("MBean clean up is not successful, any uncleared notification listeners might create a memory leak");
                logger.trace("Exception Stack trace", e);
            } else {
                logger.warn("MBean clean up is not successful, any uncleared notification listeners might create a memory leak", e);
            }
        }
    }

    /**
     * Clears up the juli references for the given class loader
     */
    public static void cleanupJULIReferences(ClassLoader classLoader) {
        String className = "java.util.logging.Level$KnownLevel";
        try {
            Class klass = Class.forName(className, true, classLoader);
            Field nameToKnownLevelsField = findField(klass, "nameToLevels");
            Field intToKnownLevelsField = findField(klass, "intToLevels");
            Field levelObjectField = findField(klass, "levelObject");
            Field mirroredLevelField = findField(klass, "mirroredLevel");
            synchronized (klass) {
                Map<Object, List> nameToKnownLevels = (Map<Object, List>) nameToKnownLevelsField.get(null);
                removeTCLKnownLevels(classLoader, nameToKnownLevels, levelObjectField, mirroredLevelField);

                Map<Object, List> intToKnownLevels = (Map<Object, List>) intToKnownLevelsField.get(null);
                removeTCLKnownLevels(classLoader, intToKnownLevels, levelObjectField, mirroredLevelField);

            }
        } catch (Exception e) {
            logger.warn("Failed to clean up juli references in the class " + className, e);
        }
    }

    private static void removeTCLKnownLevels(ClassLoader classLoader, Map<Object, List> nameToKnownLevels, Field levelObjectField,
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
                if (levelObject.getClass().getClassLoader() == classLoader) {
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
    private void typeFactoryClearTypeCache(ClassLoader classLoader) {
        if (isSharedLib()) {
            String className = "com.fasterxml.jackson.databind.type.TypeFactory";
            try {
                Class klass = ClassLoaderUtils.findLoadedClass(classLoader.getParent(), className);
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
     * To clear ResourceManager's PropertiesCache
     */
    private void resourceManagerClearPropertiesCache() {
        Class<ResourceManager> klass = ResourceManager.class;
        try {
            Field propertiesCache = findField(klass, "propertiesCache");
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
    
    private void clearLdapThreadConnections(ClassLoader classLoader) {
        List<Thread> threads = getThreads(classLoader);
        for (Thread thread : threads) {
            if (isAliveAndNotCurrentThread(thread)) {
                try {
                    if (thread.getName().startsWith("Thread-")) {
                        Field targetField = findField(Thread.class, "target");
                        Runnable runnable = (Runnable) targetField.get(thread);
                        if (runnable != null && runnable instanceof Connection) {
                            logger.info("Interrupting LDAP connection thread");
                            Connection conn = (Connection) runnable;
                            WMIOUtils.closeSilently(conn.inStream);
                            WMIOUtils.closeSilently(conn.outStream);
                            Field parent = findField(Connection.class, "parent");
                            LdapClient ldapClient = (LdapClient) parent.get(conn);
                            ldapClient.closeConnection();
                            LdapPoolManager.expire(3000);
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
    private void deregisterDrivers(ClassLoader classLoader) {
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
                if (driver.getClass().getClassLoader() == classLoader) {
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
    
    public static void deregisterSecurityProviders(ClassLoader classLoader) {
        logger.info("Attempting to deregister any security providers registered by webapp");
        Provider[] providers = Security.getProviders();
        for (Provider provider : providers) {
            if (provider.getClass().getClassLoader() == classLoader) {
                logger.info("De registering security provider {} with name {} which is registered in the class loader", provider, provider.getName());
                Security.removeProvider(provider.getName());
            }
        }
        
    }

    /**
     * Will interrupt all the running threads in the given class loader except current thread.
     * Post interrupt after a specific timeout if any threads are still alive it logs a message
     */
    public static void stopRunningThreads(ClassLoader classLoader, long waitTimeOutInMillis) {
        shutDownMySQLThreadIfAny(classLoader);
        shutDownHSQLTimerThreadIfAny(classLoader);
        try {
            List<Thread> threads = getThreads(classLoader);
            List<Thread> runningThreads = new ArrayList<>();
            for (Thread thread : threads) {
                if (isAliveAndNotCurrentThread(thread)) {
                    logger.info("Interrupting thread {}", thread);
                    thread.interrupt();
                    runningThreads.add(thread);
                }
                stopTimerThread(thread);
            }
            if (!runningThreads.isEmpty()) {
                logger.info("Waiting for interrupted threads to be finished in max of {} ms", waitTimeOutInMillis);
                join(runningThreads, waitTimeOutInMillis);
                for (Thread thread : runningThreads) {
                    if (thread.isAlive()) {
                        StackTraceElement[] stackTrace = thread.getStackTrace();
                        Throwable throwable = new IllegalThreadStateException("Thread [" + thread.getName() + "] is Still running");
                        throwable.setStackTrace(stackTrace);
                        logger.warn("Thread {} is still alive after waiting for {} and will mostly probably create a memory leak", thread.getName(), 
                                waitTimeOutInMillis, throwable);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Failed in stopRunningThreads", e);
        }
    }

    private static void stopTimerThread(Thread thread) {
        if (!thread.getClass().getName().startsWith("java.util.Timer")) {
            return;
        }
        logger.info("Stopping Timer thread {}", thread);
        Field newTasksMayBeScheduled = findField(thread.getClass(), "newTasksMayBeScheduled");
        Field queueField = findField(thread.getClass(), "queue");
        if (queueField != null && newTasksMayBeScheduled != null) {
            try {
                Object queue = queueField.get(thread);
                newTasksMayBeScheduled.set(thread, false);
                Method clearMethod = findMethod(queue.getClass(), "clear");
                synchronized (queue) {
                    clearMethod.invoke(queue);
                    newTasksMayBeScheduled.set(thread, false);
                    queue.notify();
                }
            } catch (Exception e) {
                logger.warn("Failed to stop timer thread {}", thread, e);
            }
        } else {
            logger.warn("Couldn't stop timer thread {} as one of newTasksMayBeScheduled/queue fields are not present in the class {}", thread, thread
                    .getClass().getName());
        }
        
    }

    /**
     * returns threads running in the given in class loader context or whose class is loaded from given class loader 
     * @param classLoader
     * @return
     */
    private static List<Thread> getThreads(ClassLoader classLoader) {
        return Thread.getAllStackTraces().keySet().stream().filter(thread -> {
            return thread.getContextClassLoader() == classLoader || thread.getClass().getClassLoader() == classLoader;
        }).collect(Collectors.toList());
    }

    private static boolean isAliveAndNotCurrentThread(Thread thread) {
        return thread.isAlive() && thread != Thread.currentThread();
    }

    private static synchronized void join(List<Thread> threads, long millis) throws InterruptedException {
        if (millis < 0) {
            throw new IllegalArgumentException("timeout value is negative");
        } else if (millis == 0) {
            for (Thread thread : threads) {
                thread.join();
            }
        } else {

            long base = System.currentTimeMillis();
            long now = 0;

            for (Thread thread : threads) {
                while (thread.isAlive()) {
                    long delay = millis - now;
                    if (delay <= 0) {
                        break;
                    }
                    thread.join(delay);
                    now = System.currentTimeMillis() - base;
                }
            }
        }
    }
    
    private static ClassLoader getAppClassLoader() {
        return Thread.currentThread().getContextClassLoader();
    }
    
    private static Field findField(Class klass, String name) {
        Field field = ReflectionUtils.findField(klass, name);
        if (field != null) {
            field.setAccessible(true);
        }
        return field;
    }

    private static Method findMethod(Class klass, String name, Class... paramTypes) {
        Method method = ReflectionUtils.findMethod(klass, name, paramTypes);
        if (method != null) {
            method.setAccessible(true);
        }
        return method;
    }
}
