package com.wavemaker.runtime.filter;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

import org.springframework.web.filter.DelegatingFilterProxy;

/**
 * @author Uday Shankar
 */
public class WMSecurityFilter extends DelegatingFilterProxy {

    private boolean appTestRunMode;

    @Override
    protected void initFilterBean() throws ServletException {
        FilterConfig filterConfig = getFilterConfig();
        appTestRunMode = !"production".equals(filterConfig.getInitParameter("runMode"));
        super.initFilterBean();
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {

        if (appTestRunMode && "true".equals(((HttpServletRequest) servletRequest).getHeader("skipSecurity"))) {
            // Ignore the DelegatingProxyFilter delegate
            filterChain.doFilter(servletRequest, servletResponse);
        } else {
            // Call the delegate
            super.doFilter(servletRequest, servletResponse, filterChain);
        }
    }
}
