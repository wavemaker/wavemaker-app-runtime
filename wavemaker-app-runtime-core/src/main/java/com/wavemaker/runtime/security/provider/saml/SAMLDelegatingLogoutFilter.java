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
package com.wavemaker.runtime.security.provider.saml;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.saml.SAMLLogoutFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.util.Assert;
import org.springframework.web.filter.GenericFilterBean;

import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.wrapper.StringWrapper;
import com.wavemaker.runtime.security.filter.WMSAMLLogoutFilter;
import com.wavemaker.runtime.util.HttpRequestUtils;

/**
 * Created by ArjunSahasranam on 25/11/16.
 */
public class SAMLDelegatingLogoutFilter extends GenericFilterBean {

    private RequestMatcher logoutRequestMatcher;

    @Autowired
    private WMSAMLLogoutFilter samlLogoutFilter;

    private static final Logger logger = LoggerFactory.getLogger(SAMLDelegatingLogoutFilter.class);

    public SAMLDelegatingLogoutFilter() {
        setFilterProcessesUrl("/j_spring_security_logout");
    }

    @Override
    public void doFilter(
            final ServletRequest req, final ServletResponse res,
            final FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        if (requiresLogout(request, response)) {
            logger.info("Request for logout");
            if (HttpRequestUtils.isAjaxRequest(request)) {
                logger.info("Redirecting to the same request uri {}", request.getRequestURI());
                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write(JSONUtils.toJSON(new StringWrapper(request.getRequestURI())));
                response.getWriter().flush();
                return;
            } else {
                logger.info("Delegating to {}", samlLogoutFilter.getClass().getSimpleName());
                samlLogoutFilter.doFilter(request, response, chain);
            }

        } else {
            chain.doFilter(request, response);
        }
    }

    /**
     * Allow subclasses to modify when a logout should take place.
     *
     * @param request the request
     * @param response the response
     *
     * @return <code>true</code> if logout should occur, <code>false</code> otherwise
     */
    protected boolean requiresLogout(HttpServletRequest request,
                                     HttpServletResponse response) {
        return logoutRequestMatcher.matches(request);
    }

    public void setLogoutRequestMatcher(RequestMatcher logoutRequestMatcher) {
        Assert.notNull(logoutRequestMatcher, "logoutRequestMatcher cannot be null");
        this.logoutRequestMatcher = logoutRequestMatcher;
    }

    public void setFilterProcessesUrl(String filterProcessesUrl) {
        this.logoutRequestMatcher = new AntPathRequestMatcher(filterProcessesUrl);
    }
}
