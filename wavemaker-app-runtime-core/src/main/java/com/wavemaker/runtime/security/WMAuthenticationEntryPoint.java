/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
 * <p/>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p/>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p/>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.security;

import java.io.IOException;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;

public class WMAuthenticationEntryPoint extends
        LoginUrlAuthenticationEntryPoint {
    private boolean forceHttps = false;

    private boolean useForward = false;

    private static final String LOGIN_PAGE_PREPEND = "#";

    private String loginPage;

    private final RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response, AuthenticationException authException)
            throws IOException, ServletException {

        if (isAjaxRequest(request)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
        } else {
            String redirectUrl = null;

            if (useForward) {

                if (forceHttps && "http".equals(request.getScheme())) {
                    // First redirect the current request to HTTPS.
                    // When that request is received, the forward to the login
                    // page
                    // will be used.
                    redirectUrl = buildHttpsRedirectUrlForRequest(request);
                }

                if (redirectUrl == null) {
                    String loginForm = determineUrlToUseForThisRequest(request,
                            response, authException);

                    RequestDispatcher dispatcher = request.getRequestDispatcher(loginForm);

                    dispatcher.forward(request, response);

                    return;
                }
            } else {
                // redirect to login page. Use https if forceHttps true

                redirectUrl = buildRedirectUrlToLoginPage(request, response, authException);
                String q = request.getQueryString();
                if (q != null && !q.isEmpty()) {
                    redirectUrl = prepareUrlForParams(redirectUrl).concat(q);
                }

            }

            redirectStrategy.sendRedirect(request, response, redirectUrl);
        }
    }

    @Override
    protected String determineUrlToUseForThisRequest(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) {
        String loginFormUrl = super.determineUrlToUseForThisRequest(request, response, exception);
        if (StringUtils.isNotBlank(loginPage)) {
            loginFormUrl += LOGIN_PAGE_PREPEND + loginPage;
        }
        return loginFormUrl;
    }

    private String prepareUrlForParams(String url) {
        if (url.contains("?") || url.contains("%3F"))
            url = url + "&";
        else
            url = url + "?";
        return url;
    }

    public String getLoginPage() {
        return loginPage;
    }

    public void setLoginPage(String loginPage) {
        this.loginPage = loginPage;
    }

    private boolean isAjaxRequest(HttpServletRequest request) {
        return "XMLHttpRequest".equals(request.getHeader("X-Requested-With"));
    }

}
