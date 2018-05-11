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
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.web.header.writers.ContentSecurityPolicyHeaderWriter;
import org.springframework.security.web.header.writers.frameoptions.AllowFromStrategy;
import org.springframework.security.web.header.writers.frameoptions.StaticAllowFromStrategy;
import org.springframework.security.web.header.writers.frameoptions.XFrameOptionsHeaderWriter;
import org.springframework.web.filter.GenericFilterBean;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.model.security.FrameOptions;
import com.wavemaker.commons.util.HttpRequestUtils;

/**
 * Filter implementation to add header X-Frame-Options.
 */
public class WMFrameOptionsHeaderFilter extends GenericFilterBean {

    /*Space after 'frame-ancestors' in FRAME_ANCESTOR_HEADER is mandatory.
    * */
    private FrameOptions frameOptions;
    private String allowFromUrl;
    private Map<String, URI> validDomains;
    private boolean enabled;

    @Override
    protected void initFilterBean() throws ServletException {
        super.initFilterBean();
        enabled = frameOptions.isEnabled();
        allowFromUrl = frameOptions.getAllowFromUrl();
        validDomains = new HashMap<>();
        if (allowFromUrl != null) {
            Arrays.stream(allowFromUrl.split(",")).map(domain -> {
                domain = domain.trim();
                if (domain.endsWith("/")) {
                    domain = domain.substring(0, domain.length() - 1);
                }
                return domain;
            }).forEach(domain -> {
                try {
                    URI uri = new URI(domain);
                    validDomains.put(domain, uri);
                } catch (URISyntaxException e) {
                    throw new WMRuntimeException("Invalid allow from url " + allowFromUrl, e);
                }
            });
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws
            IOException, ServletException {
        if (enabled) {
            HttpServletRequest httpServletRequest = (HttpServletRequest) request;
            HttpServletResponse httpServletResponse = (HttpServletResponse) response;
            /*
             * If the UserAgent is IE XFrameOption header is sent, else ContentSecurityPolicy header is sent.
             * Most of the browsers except IE, supports ContentSecurityPolicy header.
             *  */
            FrameOptionsHeaderWriter frameOptionsHeaderWriter = (HttpRequestUtils.isRequestedFromIEBrowser(httpServletRequest)) ?
                    new WMXFrameOptionsHeaderWriter() : new CSPFrameOptionsHeaderWriter();
            frameOptionsHeaderWriter.writeHeaders(frameOptions.getMode(), validDomains, httpServletRequest, httpServletResponse);
        }
        chain.doFilter(request, response);
    }

    public void setFrameOptions(FrameOptions frameOptions) {
        this.frameOptions = frameOptions;
    }

    private interface FrameOptionsHeaderWriter {
        void writeHeaders(FrameOptions.Mode frameOptions, Map<String, URI> validUrls, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse);
    }

    private static abstract class AbstractFrameOptionsHeaderWriter implements FrameOptionsHeaderWriter {

        public void writeHeaders(FrameOptions.Mode frameOptionsMode, Map<String, URI> validDomains, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
            if (FrameOptions.Mode.ALLOW_FROM.equals(frameOptionsMode)) {
                String refererUrl = httpServletRequest.getHeader("Referer");
                String refererHost = HttpRequestUtils.getBaseUrl(refererUrl);
                String host = HttpRequestUtils.getBaseUrl(httpServletRequest);
                URI uri = validDomains.get(refererHost);
                if (host.equals(refererHost) || uri == null) {
                    writeNonAllowFromHeader(FrameOptions.Mode.SAMEORIGIN, httpServletRequest, httpServletResponse);
                } else {
                    writeAllowFromHeader(uri, httpServletRequest, httpServletResponse);
                }
            } else {
                writeNonAllowFromHeader(frameOptionsMode, httpServletRequest, httpServletResponse);
            }
        }

        protected abstract void writeNonAllowFromHeader(FrameOptions.Mode mode, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse);

        protected abstract void writeAllowFromHeader(URI uri, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse);
    }

    private static class WMXFrameOptionsHeaderWriter extends AbstractFrameOptionsHeaderWriter {

        private static final XFrameOptionsHeaderWriter SAMEORIGIN_XFRAME_OPTIONS_HEADER_WRITER = new XFrameOptionsHeaderWriter(XFrameOptionsHeaderWriter
                .XFrameOptionsMode.SAMEORIGIN);

        private static final XFrameOptionsHeaderWriter DENY_XFRAME_OPTIONS_HEADER_WRITER = new XFrameOptionsHeaderWriter(XFrameOptionsHeaderWriter
                .XFrameOptionsMode.DENY);

        @Override
        protected void writeNonAllowFromHeader(FrameOptions.Mode mode, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
            XFrameOptionsHeaderWriter xFrameOptionsHeaderWriter = (mode == FrameOptions.Mode.SAMEORIGIN) ? SAMEORIGIN_XFRAME_OPTIONS_HEADER_WRITER :
                    DENY_XFRAME_OPTIONS_HEADER_WRITER;
            xFrameOptionsHeaderWriter.writeHeaders(httpServletRequest, httpServletResponse);
        }

        @Override
        protected void writeAllowFromHeader(URI uri, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
            AllowFromStrategy allowFromStrategy = new StaticAllowFromStrategy(uri);
            XFrameOptionsHeaderWriter xFrameOptionsHeaderWriter = new XFrameOptionsHeaderWriter(allowFromStrategy);
            xFrameOptionsHeaderWriter.writeHeaders(httpServletRequest, httpServletResponse);
        }
    }

    private static class CSPFrameOptionsHeaderWriter extends AbstractFrameOptionsHeaderWriter {

        private static String FRAME_ANCESTORS_HEADER = "frame-ancestors ";

        private static final ContentSecurityPolicyHeaderWriter SELF_CONTENT_SECURITY_POLICY_HEADER_WRITER = new ContentSecurityPolicyHeaderWriter
                (FRAME_ANCESTORS_HEADER + "'self'");

        private static final ContentSecurityPolicyHeaderWriter NONE_CONTENT_SECURITY_POLICY_HEADER_WRITER = new ContentSecurityPolicyHeaderWriter
                (FRAME_ANCESTORS_HEADER + "'none'");

        @Override
        protected void writeNonAllowFromHeader(FrameOptions.Mode mode, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
            ContentSecurityPolicyHeaderWriter contentSecurityPolicyHeaderWriter = (mode == FrameOptions.Mode.SAMEORIGIN) ?
                    SELF_CONTENT_SECURITY_POLICY_HEADER_WRITER : NONE_CONTENT_SECURITY_POLICY_HEADER_WRITER;
            contentSecurityPolicyHeaderWriter.writeHeaders(httpServletRequest, httpServletResponse);
        }

        @Override
        protected void writeAllowFromHeader(URI uri, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
            String baseUrl = HttpRequestUtils.getBaseUrl(uri);
            String cspPolicyValue = FRAME_ANCESTORS_HEADER + baseUrl;
            ContentSecurityPolicyHeaderWriter contentSecurityPolicyHeaderWriter = new ContentSecurityPolicyHeaderWriter(cspPolicyValue);
            contentSecurityPolicyHeaderWriter.writeHeaders(httpServletRequest, httpServletResponse);
        }
    }

}
