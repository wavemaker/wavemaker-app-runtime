/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.security.filter;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.web.header.writers.frameoptions.AllowFromStrategy;
import org.springframework.security.web.header.writers.frameoptions.StaticAllowFromStrategy;
import org.springframework.security.web.header.writers.frameoptions.XFrameOptionsHeaderWriter;
import org.springframework.web.filter.GenericFilterBean;

import com.wavemaker.commons.WMRuntimeException;

/**
 * Filter implementation to add header X-Frame-Options.
 */
public class WMXFrameOptionsHeaderFilter extends GenericFilterBean {

    private XFrameOptionsHeaderWriter xFrameOptionsHeaderWriter;

    private XFrameOptionsHeaderWriter.XFrameOptionsMode xFrameOptionsMode;
    private String allowFromUrl;

    @Override
    public void initFilterBean() throws ServletException {
        super.initFilterBean();
        if (XFrameOptionsHeaderWriter.XFrameOptionsMode.ALLOW_FROM.equals(xFrameOptionsMode)) {
            URI uri = null;
            try {
                uri = new URI(allowFromUrl);
            } catch (URISyntaxException e) {
                throw new WMRuntimeException("Not a valid url", e);
            }
            AllowFromStrategy allowFromStrategy = new StaticAllowFromStrategy(uri);
            xFrameOptionsHeaderWriter = new XFrameOptionsHeaderWriter(allowFromStrategy);
        } else {
            xFrameOptionsHeaderWriter = new XFrameOptionsHeaderWriter(xFrameOptionsMode);
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;
        xFrameOptionsHeaderWriter.writeHeaders(httpServletRequest, httpServletResponse);
        chain.doFilter(httpServletRequest, httpServletResponse);
    }

    @Override
    public void destroy() {
    }

    public void setxFrameOptionsMode(XFrameOptionsHeaderWriter.XFrameOptionsMode xFrameOptionsMode) {
        this.xFrameOptionsMode = xFrameOptionsMode;
    }

    public void setAllowFromUrl(String allowFromUrl) {
        this.allowFromUrl = allowFromUrl;
    }
}
