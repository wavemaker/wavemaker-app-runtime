/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CsrfToken;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.csrf.SecurityConfigConstants;
import com.wavemaker.runtime.util.HttpRequestUtils;
import com.wavemaker.commons.CommonConstants;
import com.wavemaker.commons.model.security.CSRFConfig;

public class WMAuthenticationSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

    public WMAuthenticationSuccessHandler() {
        super();
    }

    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response, Authentication authentication) throws IOException,
            ServletException {
        addCsrfCookie(request, response);
        if (HttpRequestUtils.isAjaxRequest(request)) {
            request.setCharacterEncoding(CommonConstants.UTF8);
            response.setContentType("text/plain;charset=utf-8");
            response.setHeader("Cache-Control", "no-cache");
            response.setDateHeader("Expires", 0);
            response.setHeader("Pragma", "no-cache");
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().flush();
        } else {
            super.onAuthenticationSuccess(request, response, authentication);
        }
    }

    private void addCsrfCookie(HttpServletRequest request, HttpServletResponse response) {
        CSRFConfig csrfConfig = WMAppContext.getInstance().getSpringBean(CSRFConfig.class);
        if (csrfConfig != null && csrfConfig.isEnforceCsrfSecurity()) {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrfToken != null) {
                Cookie cookie = new Cookie(SecurityConfigConstants.WM_CSRF_TOKEN_COOKIE, csrfToken.getToken());
                cookie.setPath("/");
                response.addCookie(cookie);
            }
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

