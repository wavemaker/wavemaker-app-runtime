/*
 *  Copyright (C) 2012-2013 CloudJee, Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.wavemaker.runtime;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.json.JSONObject;
import org.springframework.core.io.Resource;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.context.support.ServletContextResource;
import org.springframework.web.context.support.WebApplicationContextUtils;

import com.wavemaker.common.CommonConstants;
import com.wavemaker.runtime.data.util.DataServiceConstants;

/**
 * This singleton class is to store any properties in the scope of the application context.
 * 
 * @author Seung Lee
 * @author Jeremy Grelle
 */
public class WMAppContext {

    private static WMAppContext instance;

    private int defaultTenantID = DataServiceConstants.DEFAULT_TENANT_ID;

    private String tenantFieldName = DataServiceConstants.DEFAULT_TENANT_FIELD;

    private String tenantColumnName = "";

    private ServletContext context;

    private String appName;

    private JSONObject appTypesObj;

    private Map<String, JSONObject> typesObjMap = new HashMap<String, JSONObject>();

    private String applicationHostUrl = null;

    private int applicationHostPort = 0;

    private boolean secured = false;

    private boolean initialized = false;

    private static final Logger logger = Logger.getLogger(WMAppContext.class);

    private WMAppContext(ServletContextEvent event) {
        this.context = event.getServletContext();
        this.appName = this.context.getServletContextName();
        if (this.appName == null) {
            this.appName = "Project Name";
        }

        // In Studio, the tenant field and def tenant ID is injected by ProjectManager when a project opens
        if (!this.appName.equals(DataServiceConstants.WAVEMAKER_STUDIO)) {
            // Store types.js contents in memory
            try {
                Resource typesResource = new ServletContextResource(this.context, "/types.js");
                String s = IOUtils.toString(typesResource.getInputStream());
                this.appTypesObj = new JSONObject(s.substring(11));
            } catch (Exception e) {
                logger.warn("Cannot load types.js file for the application [" + appName + "]", e);
                return;
            }

            // Set up multi-tenant info
            Resource appPropsResource = null;
            try {
                appPropsResource = new ServletContextResource(this.context, "/WEB-INF/"
                        + CommonConstants.APP_PROPERTY_FILE);
            } catch (Exception e) {
                logger.warn("Cannot load app properties resource [" + CommonConstants.APP_PROPERTY_FILE + "]", e);
                return;
            }

            if (!appPropsResource.exists()) {
                return;
            }

            Properties props;

            try {
                props = new Properties();
                InputStream is = appPropsResource.getInputStream();
                props.load(is);
                is.close();
            } catch (IOException ioe) {
                ioe.printStackTrace();
                return;
            }

            this.tenantFieldName = props.getProperty(DataServiceConstants.TENANT_FIELD_PROPERTY_NAME);
            this.tenantColumnName = props.getProperty(DataServiceConstants.TENANT_COLUMN_PROPERTY_NAME);
            this.defaultTenantID = Integer.parseInt(props
                    .getProperty(DataServiceConstants.DEFAULT_TENANT_ID_PROPERTY_NAME));
        }
    }

    public static synchronized WMAppContext getInstance(ServletContextEvent event) {
        if (instance == null) {
            instance = new WMAppContext(event);
        }

        return instance;
    }

    public static synchronized WMAppContext getInstance() {
        return instance;
    }

    @Override
    public Object clone() throws CloneNotSupportedException {
        throw new CloneNotSupportedException();
    }

    public int getDefaultTenantID() {
        if (this.appName.equals(DataServiceConstants.WAVEMAKER_STUDIO)) {
            return DataServiceConstants.DEFAULT_TENANT_ID;
        } else {
            return this.defaultTenantID;
        }
    }

    public String getTenantFieldName() {
        if (this.appName.equals(DataServiceConstants.WAVEMAKER_STUDIO)) {
            return DataServiceConstants.DEFAULT_TENANT_FIELD;
        } else {
            return this.tenantFieldName;
        }
    }

    public String getTenantColumnName() {
        if (this.appName.equals(DataServiceConstants.WAVEMAKER_STUDIO)) {
            return "";
        } else {
            return this.tenantColumnName;
        }
    }

    public boolean isMultiTenant() {
        String tf = getTenantFieldName();
        boolean multiTenancy;

        if (tf == null || tf.length() == 0 || tf.equalsIgnoreCase(DataServiceConstants.DEFAULT_TENANT_FIELD)) {
            multiTenancy = false;
        } else {
            multiTenancy = true;
        }

        return multiTenancy;
    }

    public String getAppName() {
        return this.appName;
    }

    public String getAppContextRoot() {
        return this.context.getRealPath("");
    }

    public JSONObject getTypesObject(String projectId) {
        if (projectId == null) {// Goes inside during application run time
            return appTypesObj;
        }
        return this.typesObjMap.get(projectId);// in studio run time(app design time)
    }

    public void addTypesObject(String projectId, JSONObject val) {
        this.typesObjMap.put(projectId, val);
    }

    public void removeTypesObject(String projectId) {
        this.typesObjMap.remove(projectId);
    }

    public <T> T getSpringBean(String beanId) {
        //TODO use ApplicationContext instead of WebApplicationContext
        WebApplicationContext applicationContext = WebApplicationContextUtils.getWebApplicationContext(context);
        return (T) applicationContext.getBean(beanId);
    }

    public <T> T getSpringBean(Class<T> c) {
        //TODO use ApplicationContext instead of WebApplicationContext
        WebApplicationContext applicationContext = WebApplicationContextUtils.getWebApplicationContext(context);
        return applicationContext.getBean(c);
    }

    public ServletContext getContext() {
        return context;
    }

    public void init(HttpServletRequest httpServletRequest) {
        if(!initialized) {
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