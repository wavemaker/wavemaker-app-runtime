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
package com.wavemaker.runtime.security;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CsrfToken;

import com.google.common.base.Optional;
import com.wavemaker.commons.CommonConstants;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.model.security.CSRFConfig;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.csrf.SecurityConfigConstants;
import com.wavemaker.runtime.security.model.LoginSuccessResponse;
import com.wavemaker.runtime.util.HttpRequestUtils;

import static com.wavemaker.runtime.security.SecurityConstants.CACHE_CONTROL;
import static com.wavemaker.runtime.security.SecurityConstants.EXPIRES;
import static com.wavemaker.runtime.security.SecurityConstants.NO_CACHE;
import static com.wavemaker.runtime.security.SecurityConstants.PRAGMA;
import static com.wavemaker.runtime.security.SecurityConstants.TEXT_PLAIN_CHARSET_UTF_8;

public class WMAuthenticationSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

    public WMAuthenticationSuccessHandler() {
        super();
    }

    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response, Authentication authentication) throws IOException,
            ServletException {
        Optional<CsrfToken> csrfTokenOptional = getCsrfToken(request);
        addCsrfCookie(csrfTokenOptional, request, response);
        if (HttpRequestUtils.isAjaxRequest(request)) {
            request.setCharacterEncoding(CommonConstants.UTF8);
            response.setContentType(TEXT_PLAIN_CHARSET_UTF_8);
            response.setHeader(CACHE_CONTROL, NO_CACHE);
            response.setDateHeader(EXPIRES, 0);
            response.setHeader(PRAGMA, NO_CACHE);
            response.setStatus(HttpServletResponse.SC_OK);
            writeCsrfTokenToResponse(csrfTokenOptional, response);
            response.getWriter().flush();
        } else {
            super.onAuthenticationSuccess(request, response, authentication);
        }
    }

    private Optional<CsrfToken> getCsrfToken(HttpServletRequest request) {
        CSRFConfig csrfConfig = WMAppContext.getInstance().getSpringBean(CSRFConfig.class);
        if (csrfConfig != null && csrfConfig.isEnforceCsrfSecurity()) {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            return Optional.fromNullable(csrfToken);
        }
        return Optional.absent();
    }

    private void addCsrfCookie(Optional<CsrfToken> csrfTokenOptional, HttpServletRequest request, HttpServletResponse response) {
        if (csrfTokenOptional.isPresent()) {
            CsrfToken csrfToken = csrfTokenOptional.get();
            Cookie cookie = new Cookie(SecurityConfigConstants.WM_CSRF_TOKEN_COOKIE, csrfToken.getToken());
            String contextPath = request.getContextPath();
            if (StringUtils.isBlank(contextPath)) {
                contextPath = "/";
            }
            cookie.setPath(contextPath);
            response.addCookie(cookie);
        }
    }

    private void writeCsrfTokenToResponse(Optional<CsrfToken> csrfTokenOptional, HttpServletResponse response) throws IOException {
        if (csrfTokenOptional.isPresent()) {
            CsrfToken csrfToken = csrfTokenOptional.get();
            PrintWriter writer = response.getWriter();
            LoginSuccessResponse loginSuccessResponse = new LoginSuccessResponse();
            loginSuccessResponse.setWmCsrfToken(csrfToken.getToken());
            writer.println(JSONUtils.toJSON(loginSuccessResponse));
            writer.flush();
        }
    }

    @Override
    protected String determineTargetUrl(final HttpServletRequest request, final HttpServletResponse response) {
        String targetUrl = super.determineTargetUrl(request, response);
        String redirectPage = request.getParameter("redirectPage");
        if (StringUtils.isNotEmpty(redirectPage) && StringUtils.isNotEmpty(targetUrl) && !StringUtils
                .containsAny(targetUrl, new char[]{'#', '?'}) && StringUtils.endsWith(targetUrl, "/")) {
            targetUrl += "#" + redirectPage;
        }
        return targetUrl;
    }
}

