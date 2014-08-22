package com.wavemaker.runtime.filter;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.filter.DelegatingFilterProxy;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.WMSecurityConfigStore;

/**
 * @author Uday Shankar
 */
public class WMSecurityFilter extends DelegatingFilterProxy {

    private Boolean isSecurityEnforced;

    private boolean appTestRunMode;

    @Override
    protected void initFilterBean() throws ServletException {
        FilterConfig filterConfig = getFilterConfig();
        appTestRunMode = !"production".equals(filterConfig.getInitParameter("runMode"));
        super.initFilterBean();
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        if (!isSecurityEnforced() || (appTestRunMode && "true".equals(((HttpServletRequest) servletRequest).getHeader("skipSecurity")))) {
            // Ignore the DelegatingProxyFilter delegate
            filterChain.doFilter(servletRequest, servletResponse);
        } else {
            // Call the delegate
            super.doFilter(servletRequest, servletResponse, filterChain);
        }
    }

    private boolean isSecurityEnforced() {
        if(isSecurityEnforced == null) {
            try {
                WMSecurityConfigStore wmSecurityConfigStore = WMAppContext.getInstance().getSpringBean(WMSecurityConfigStore.class);
                isSecurityEnforced = wmSecurityConfigStore.isEnforceSecurity();
            } catch (NoSuchBeanDefinitionException e) {
                isSecurityEnforced = false;
            }
        }
        return isSecurityEnforced;
    }
}
