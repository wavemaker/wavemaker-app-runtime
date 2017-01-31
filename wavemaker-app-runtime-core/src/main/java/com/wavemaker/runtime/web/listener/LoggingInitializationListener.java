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

import java.net.MalformedURLException;
import java.net.URL;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.log4j.LogManager;
import org.apache.log4j.helpers.Loader;
import org.apache.log4j.helpers.LogLog;
import org.apache.log4j.helpers.OptionConverter;

import com.wavemaker.runtime.RuntimeEnvironment;

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
 * @author Uday Shankar
 */
public class LoggingInitializationListener implements ServletContextListener {

    private static final String DEFAULT_CONFIGURATION_FILE = "log4j.properties";

    private static final String DEFAULT_XML_CONFIGURATION_FILE = "log4j.xml";

    private static final String DEFAULT_CONFIGURATION_KEY = "log4j.configuration";

    private static final String CONFIGURATOR_CLASS_KEY = "log4j.configuratorClass";

    private static final String DEFAULT_INIT_OVERRIDE_KEY = "log4j.defaultInitOverride";

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        if (RuntimeEnvironment.isTestRunEnvironment()) {
            try {
                initLog4jLogging();
            } catch (Exception e) {
                e.printStackTrace();
                System.out.println("Failed to initialize log4j logging");
            }
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        //NO-OP
    }

    private synchronized void initLog4jLogging() {
        String override = OptionConverter.getSystemProperty(DEFAULT_INIT_OVERRIDE_KEY, null);

        // if there is no default init override, then get the resource
        // specified by the user or the default config file.
        if (override == null || "false".equalsIgnoreCase(override)) {

            String configurationOptionStr = OptionConverter.getSystemProperty(
                    DEFAULT_CONFIGURATION_KEY,
                    null);

            String configuratorClassName = OptionConverter.getSystemProperty(
                    CONFIGURATOR_CLASS_KEY,
                    null);

            URL url = null;

            // if the user has not specified the log4j.configuration
            // property, we search first for the file "log4j.xml" and then
            // "log4j.properties"
            if (configurationOptionStr == null) {
                url = Loader.getResource(DEFAULT_XML_CONFIGURATION_FILE);
                if (url == null) {
                    url = Loader.getResource(DEFAULT_CONFIGURATION_FILE);
                }
            } else {
                try {
                    url = new URL(configurationOptionStr);
                } catch (MalformedURLException ex) {
                    // so, resource is not a URL:
                    // attempt to get the resource from the class path
                    url = Loader.getResource(configurationOptionStr);
                }
            }
            // If we have a non-null url, then delegate the rest of the
            // configuration to the OptionConverter.selectAndConfigure
            // method.
            if(url != null) {
                LogLog.debug("Using URL ["+url+"] for automatic log4j configuration.");
                try {
                    OptionConverter.selectAndConfigure(url, configuratorClassName,
                            LogManager.getLoggerRepository());
                } catch (NoClassDefFoundError e) {
                    LogLog.warn("Error during default initialization", e);
                }
            } else {
                LogLog.debug("Could not find resource: ["+configurationOptionStr+"].");
            }
        } else {
            LogLog.debug("Default initialization of overridden by " +
                    DEFAULT_INIT_OVERRIDE_KEY + "property.");
        }
    }
}
