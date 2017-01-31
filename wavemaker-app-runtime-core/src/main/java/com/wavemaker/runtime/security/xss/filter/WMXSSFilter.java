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
package com.wavemaker.runtime.security.xss.filter;

import java.io.IOException;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletRequestWrapper;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.filter.GenericFilterBean;

import com.wavemaker.runtime.security.xss.handler.XSSSecurityHandler;

/**
 * Created by kishorer on 20/8/15.
 */
public class WMXSSFilter extends GenericFilterBean {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        //Force XSS protection by the browser (useful if XSS protection was disabled by the user)
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;
        httpServletResponse.addHeader("X-XSS-Protection", "1");
        httpServletResponse.addHeader("mode", "block");
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        XSSSecurityHandler xssSecurityHandler = XSSSecurityHandler.getInstance();
        ServletRequestWrapper requestWrapper = xssSecurityHandler.getRequestWrapper(httpServletRequest);
        chain.doFilter(requestWrapper, httpServletResponse);
    }

    @Override
    public void destroy() {
    }
}
