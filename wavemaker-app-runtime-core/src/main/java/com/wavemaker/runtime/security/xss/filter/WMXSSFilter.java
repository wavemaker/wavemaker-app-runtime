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
package com.wavemaker.runtime.security.xss.filter;

import java.io.IOException;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.web.filter.GenericFilterBean;


/**
 * Filter implementation to add header X-XSS-Protection and XSS encode filter.
 */
public class WMXSSFilter extends GenericFilterBean {

    private XXssProtectionHeaderWriter xXssProtectionHeaderWriter = null;

    @Override
    protected void initFilterBean() throws ServletException {
        super.initFilterBean();

        xXssProtectionHeaderWriter = new XXssProtectionHeaderWriter();
        xXssProtectionHeaderWriter.setBlock(true);
        xXssProtectionHeaderWriter.setEnabled(true);
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;

        xXssProtectionHeaderWriter.writeHeaders(httpServletRequest, httpServletResponse);

        chain.doFilter(request, httpServletResponse);
    }

    @Override
    public void destroy() {
    }
}
