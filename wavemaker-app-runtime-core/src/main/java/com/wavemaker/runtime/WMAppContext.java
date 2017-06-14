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
package com.wavemaker.runtime;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;

import com.wavemaker.runtime.prefab.context.PrefabThreadLocalContextManager;

/**
 * This singleton class is to store any properties in the scope of the application context and its prefabs context.
 *
 * @author Seung Lee
 * @author Jeremy Grelle
 */
public class WMAppContext {

    private ServletContext context;

    private String applicationHostUrl = null;

    private int applicationHostPort = 0;

    private boolean secured = false;

    private boolean initialized = false;
    
    private PrefabThreadLocalContextManager prefabThreadLocalContextManager;

    private static WMAppContext instance;

    private static final Logger logger = LoggerFactory.getLogger(WMAppContext.class);

    private WMAppContext(ServletContextEvent event) {
        this.context = event.getServletContext();
    }

    public static synchronized WMAppContext init(ServletContextEvent event) {
        if (instance == null) {
            instance = new WMAppContext(event);
        }

        return instance;
    }

    public static synchronized WMAppContext getInstance() {
        return instance;
    }

    public static void clearInstance() {
        instance = null;
    }

    @Override
    public Object clone() throws CloneNotSupportedException {
        throw new CloneNotSupportedException();
    }

    public String getAppContextRoot() {
        return this.context.getRealPath("/");
    }

    public <T> T getSpringBean(String beanId) {
        ApplicationContext applicationContext = detectCurrentApplicationContext();
        return (T) applicationContext.getBean(beanId);
    }

    public <T> T getSpringBean(Class<T> c) {
        ApplicationContext applicationContext = detectCurrentApplicationContext();
        return applicationContext.getBean(c);
    }

    private ApplicationContext detectCurrentApplicationContext() {
        PrefabThreadLocalContextManager prefabThreadLocalContextManager = getPrefabThreadLocalContextManager();
        ApplicationContext applicationContext = getRootApplicationContext();
        if (prefabThreadLocalContextManager != null) {
            ApplicationContext context = prefabThreadLocalContextManager.getContext();
            if (context != null) {
                applicationContext = context;
            }
        }
        return applicationContext;
    }

    private PrefabThreadLocalContextManager getPrefabThreadLocalContextManager() {
        if (prefabThreadLocalContextManager == null) {//Locking not really needed
            PrefabThreadLocalContextManager prefabThreadLocalContextManager = null;
            try {
                prefabThreadLocalContextManager = getRootApplicationContext().getBean(PrefabThreadLocalContextManager.class);
            } catch (NoSuchBeanDefinitionException e) {
                prefabThreadLocalContextManager = new PrefabThreadLocalContextManager();//To prevent this method being called every time
            }
            this.prefabThreadLocalContextManager = prefabThreadLocalContextManager;
        }
        return this.prefabThreadLocalContextManager;
    }

    private ApplicationContext getRootApplicationContext() {
        return WebApplicationContextUtils.getWebApplicationContext(context);
    }

    public ServletContext getContext() {
        return context;
    }

    public void init(HttpServletRequest httpServletRequest) {
        if (!initialized) {
            applicationHostUrl = httpServletRequest.getServerName();
            applicationHostPort = httpServletRequest.getServerPort();
            secured = httpServletRequest.isSecure();
            initialized = true;
        }
    }

    public String getApplicationHostUrl() {
        return applicationHostUrl;
    }

    public int getApplicationHostPort() {
        return applicationHostPort;
    }

    public boolean isSecured() {
        return secured;
    }
}
