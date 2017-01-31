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
package com.wavemaker.runtime.filter;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.DelegatingFilterProxy;

import com.wavemaker.runtime.RuntimeEnvironment;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.config.WMAppSecurityConfig;

/**
 * @author Uday Shankar
 */
public class WMSecurityFilter extends DelegatingFilterProxy {

    private Boolean isSecurityEnforced;

    private boolean skipSecurityEnabled;

    @Override
    protected void initFilterBean() throws ServletException {
        if (isSecurityEnforced()) {
            super.initFilterBean();
        }
        skipSecurityEnabled = RuntimeEnvironment.isTestRunEnvironment();
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        try {
            if (!isSecurityEnforced() || (skipSecurityEnabled && "true".equals(((HttpServletRequest) servletRequest).getHeader("skipSecurity")))) {
                // Ignore the DelegatingProxyFilter delegate
                filterChain.doFilter(servletRequest, servletResponse);
            } else {
                // Call the delegate
                super.doFilter(servletRequest, servletResponse, filterChain);
            }
        } finally {
            SecurityContextHolder.clearContext();//Cleaning any Thread local map values if created
        }
    }

    private boolean isSecurityEnforced() {
        if (isSecurityEnforced == null) {
            try {
                WMAppSecurityConfig wmAppSecurityConfig = WMAppContext.getInstance().getSpringBean(WMAppSecurityConfig.class);
                isSecurityEnforced = wmAppSecurityConfig.isEnforceSecurity();
            } catch (NoSuchBeanDefinitionException e) {
                isSecurityEnforced = false;
            }
        }
        return isSecurityEnforced;
    }
}
