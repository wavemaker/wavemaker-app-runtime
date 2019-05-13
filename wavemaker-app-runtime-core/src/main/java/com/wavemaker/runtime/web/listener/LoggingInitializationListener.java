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
package com.wavemaker.runtime.web.listener;

import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.Properties;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.PropertyConfigurator;
import org.apache.log4j.helpers.Loader;
import org.apache.log4j.helpers.LogLog;
import org.apache.log4j.helpers.OptionConverter;
import org.slf4j.MDC;

import com.wavemaker.commons.util.WMIOUtils;
import com.wavemaker.runtime.RuntimeEnvironment;
import com.wavemaker.runtime.web.filter.WMRequestFilter;

/**
 *
 * This class provides a workaround to the staticLog Issue mentioned in the below link.
 * <a href="http://wiki.apache.org/commons/Logging/StaticLog">http://wiki.apache.org/commons/Logging/StaticLog</a>
 *
 * <p>
 *
 * This workaround lets each application define their own logging configuration. Below are the points to be noted.
 * <ul>
 *     <li>This is enabled only in testRun environment where shared lib approach is used and multiple applications are run on the same server</li>
 *     <li>This class reloads logging configuration each time an application is deployed.</li>
 *     <li>With this each app can have its own logging configuration instead of a single configuration fetched from the first application's configuration
 * when slf4j and log4j related jars are present in shared lib.</li>
 *     <li>Loggers used by the classes in the shared lib are also reconfigured to use the latest app's configuration</li>
 *     <li>If two applications are running simultaneously, the configuration set by the latest ran application will be used</li>
 *     <li>One issue is that the configuration in the old running app will be updated the new configuration changes</li>
 * </ul>
 * </p>
 *
 * It works in conjuction with {@link AppNameMDCStartStopListener} class for starting and stopping mdc variables. Check its documentation for more details. 
 *
 * @author Uday Shankar
 */
public class LoggingInitializationListener implements ServletContextListener {

    private static final String DEFAULT_CONFIGURATION_FILE = "log4j.properties";

    private static final String DEFAULT_INIT_OVERRIDE_KEY = "log4j.defaultInitOverride";

    static {
        if (RuntimeEnvironment.isTestRunEnvironment()) {
            try {
                System.out.println("Reinitializing log4j configuration");
                initLog4jLogging();
            } catch (Exception e) {
                e.printStackTrace();
                System.out.println("Failed to initialize log4j logging");
            }
        }
    }

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        if (RuntimeEnvironment.isTestRunEnvironment()) {
            MDC.put(WMRequestFilter.APP_NAME_KEY, sce.getServletContext().getContextPath());
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (RuntimeEnvironment.isTestRunEnvironment()) {
            MDC.remove(WMRequestFilter.APP_NAME_KEY);
        }
    }

    private static synchronized void initLog4jLogging() {
        String override = OptionConverter.getSystemProperty(DEFAULT_INIT_OVERRIDE_KEY, null);

        // if there is no default init override, then get the resource
        // specified by the user or the default config file.
        if (override == null || "false".equalsIgnoreCase(override)) {
            URL url = Loader.getResource(DEFAULT_CONFIGURATION_FILE);
            if(url != null) {
                LogLog.debug("Using URL ["+url+"] for automatic log4j configuration.");
                try {
                    Properties properties = readProperties(url);
                    updatePropertiesWithWMCustomAppender(properties);
                    //configuring the logger with updated properties.
                    PropertyConfigurator.configure(properties);
                } catch (NoClassDefFoundError e) {
                    LogLog.warn("Error during default initialization", e);
                }
            }
        } else {
            LogLog.debug("Default initialization of overridden by " +
                    DEFAULT_INIT_OVERRIDE_KEY + "property.");
        }
    }

    private static void updatePropertiesWithWMCustomAppender(Properties properties) {
        String rootLoggerPropertyValue = properties.getProperty("log4j.rootLogger");
        if (StringUtils.isBlank(rootLoggerPropertyValue)) {
            rootLoggerPropertyValue = "info";
        }
        String rootLevel = rootLoggerPropertyValue.split(",")[0];
        rootLevel = rootLevel.concat(", wmAppender");
        properties.setProperty("log4j.rootLogger", rootLevel);

        //removing all the appenders and adding the WMAppender
        for (String property: properties.stringPropertyNames()) {
            if (property.startsWith("log4j.appender")) {
                properties.remove(property);
            }
        }

        properties.setProperty("log4j.appender.wmAppender", "org.apache.log4j.RollingFileAppender");
        properties.setProperty("log4j.appender.wmAppender.encoding","UTF-8");
        properties.setProperty("log4j.appender.wmAppender.File", System.getProperty("wm.apps.log",
                System.getProperty("java.io.tmpdir") + "/apps.log"));
        properties.setProperty("log4j.appender.wmAppender.layout","org.apache.log4j.PatternLayout");
        properties.setProperty("log4j.appender.wmAppender.layout.ConversionPattern","%d{dd MMM yyyy HH:mm:ss,SSS} -%X{wm.app.name} " +
                "-%X{X-WM-Request-Track-Id} %t %p [%c] - %m%n");
        properties.setProperty("log4j.appender.wmAppender.MaxFileSize", "10MB");
        properties.setProperty("log4j.appender.wmAppender.MaxBackupIndex", "5");
    }

    private static Properties readProperties(URL url) {
        Properties props = new Properties();
        LogLog.debug("Reading configuration from URL " + url);
        InputStream inputStream = null;
        try {
            URLConnection uConn = url.openConnection();
            uConn.setUseCaches(false);
            inputStream = uConn.getInputStream();
            props.load(inputStream);
        } catch (Exception e) {
            LogLog.error("Could not read configuration file from URL [" + url + "].", e);
            LogLog.error("Ignoring configuration file [" + url +"].");
        } finally {
            WMIOUtils.closeSilently(inputStream);
        }
        return props;
    }
}
