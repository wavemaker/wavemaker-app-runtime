package com.wavemaker.runtime.security.xss.handler;

import java.util.regex.Pattern;
import javax.servlet.ServletRequestWrapper;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.config.WMAppSecurityConfig;
import com.wavemaker.runtime.security.xss.XSSRequestWrapper;
import com.wavemaker.runtime.security.xss.sanitizer.DefaultXSSSanitizer;
import com.wavemaker.runtime.security.xss.sanitizer.XSSEncodeSanitizer;
import com.wavemaker.runtime.security.xss.sanitizer.XSSSanitizer;
import com.wavemaker.runtime.security.xss.sanitizer.XSSWhiteListSanitizer;
import com.wavemaker.studio.common.model.security.XSSConfig;
import com.wavemaker.studio.common.model.security.XSSFilterStrategy;

/**
 * Created by kishorer on 6/7/16.
 */
public class XSSSecurityHandler {

    private static final String WM_APP_SECURITY_CONFIG = "WMAppSecurityConfig";

    private static final XSSSecurityHandler instance = new XSSSecurityHandler();

    private boolean isInitialized = false;
    private XSSSanitizer xssSanitizer;
    private XSSConfig xssConfig;

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
         return  isXSSEnabled() && matches(request, xssConfig.getAllowedMethods());
    }

    private boolean isXSSEnabled() {
        return xssConfig != null && xssConfig.isEnforceXssSecurity();
    }

    private boolean matches(HttpServletRequest httpServletRequest, Pattern allowedMethods) {
        if(allowedMethods.matcher(httpServletRequest.getMethod()).matches()) {
            return false;
        }
        return true;
    }

    private void initConfiguration() {
        WMAppSecurityConfig wmAppSecurityConfig = WMAppContext.getInstance().getSpringBean(WM_APP_SECURITY_CONFIG);
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
