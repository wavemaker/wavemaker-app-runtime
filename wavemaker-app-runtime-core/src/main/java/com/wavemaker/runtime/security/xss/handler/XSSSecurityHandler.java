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
package com.wavemaker.runtime.security.xss.handler;

import java.util.regex.Pattern;

import javax.servlet.ServletRequestWrapper;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.config.WMAppSecurityConfig;
import com.wavemaker.runtime.security.xss.XSSRequestWrapper;
import com.wavemaker.runtime.security.xss.sanitizer.DefaultXSSSanitizer;
import com.wavemaker.runtime.security.xss.sanitizer.XSSEncodeSanitizer;
import com.wavemaker.runtime.security.xss.sanitizer.XSSSanitizer;
import com.wavemaker.runtime.security.xss.sanitizer.XSSWhiteListSanitizer;
import com.wavemaker.commons.model.security.XSSConfig;
import com.wavemaker.commons.model.security.XSSFilterStrategy;

/**
 * Created by kishorer on 6/7/16.
 */
public class XSSSecurityHandler {

    private static final String WM_APP_SECURITY_CONFIG = "WMAppSecurityConfig";

    private static final Logger LOGGER = LoggerFactory
            .getLogger(XSSSecurityHandler.class);

    private static final XSSSecurityHandler instance = new XSSSecurityHandler();

    private boolean isInitialized = false;
    private XSSSanitizer xssSanitizer;
    private XSSConfig xssConfig;

    private XSSSecurityHandler() {
    }

    public static XSSSecurityHandler getInstance() {
        return instance;
    }

    public ServletRequestWrapper getRequestWrapper(HttpServletRequest request) {
        if (!isInitialized) {
            initConfiguration();
        }
        if (isXSSEnabledForMethod(request)) {
            return new XSSRequestWrapper(request, this);
        }
        return new HttpServletRequestWrapper(request);
    }

    public String sanitizeRequestData(String data) {
        if (!isInitialized) {
            initConfiguration();
        }
        return xssSanitizer.sanitizeRequestData(data);
    }

    private boolean isXSSEnabledForMethod(HttpServletRequest request) {
        return isXSSEnabled() && matches(request, XSSConfig.ALLOWED_METHODS);
    }

    private boolean isXSSEnabled() {
        return xssConfig != null && xssConfig.isEnforceXssSecurity();
    }

    private boolean matches(HttpServletRequest httpServletRequest, Pattern allowedMethods) {
        if (allowedMethods.matcher(httpServletRequest.getMethod()).matches()) {
            return false;
        }
        return true;
    }

    private void initConfiguration() {
        WMAppSecurityConfig wmAppSecurityConfig = null;
        try {
            wmAppSecurityConfig = WMAppContext.getInstance().getSpringBean(WM_APP_SECURITY_CONFIG);
        } catch (NoSuchBeanDefinitionException e) {
            LOGGER.warn("WMAppSecurityConfig bean not found in the application");
        }
        if (wmAppSecurityConfig != null) {
            xssConfig = wmAppSecurityConfig.getXssConfig();
            if (isXSSEnabled()) {
                buildSanitizer(xssConfig.getXssFilterStrategy());
            } else {
                buildSanitizer(XSSFilterStrategy.NONE);
            }
        } else {
            buildSanitizer(XSSFilterStrategy.NONE);
        }
        isInitialized = true;
    }

    private void buildSanitizer(XSSFilterStrategy strategy) {
        switch (strategy) {
            case ENCODE:
                xssSanitizer = new XSSEncodeSanitizer();
                break;
            case WHITE_LIST:
                xssSanitizer = new XSSWhiteListSanitizer(xssConfig.getPolicyFile());
                break;
            case NONE:
                xssSanitizer = new DefaultXSSSanitizer();
        }
    }
}
