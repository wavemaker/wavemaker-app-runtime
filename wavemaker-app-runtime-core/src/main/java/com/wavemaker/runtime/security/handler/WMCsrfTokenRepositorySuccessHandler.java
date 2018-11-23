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
package com.wavemaker.runtime.security.handler;

import java.io.IOException;
import java.util.Optional;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;

import com.wavemaker.commons.model.security.CSRFConfig;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.csrf.SecurityConfigConstants;

/**
 * Created by srujant on 31/10/18.
 */
public class WMCsrfTokenRepositorySuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(WMCsrfTokenRepositorySuccessHandler.class);

    private CsrfTokenRepository csrfTokenRepository;

    public WMCsrfTokenRepositorySuccessHandler(CsrfTokenRepository csrfTokenRepository) {
        this.csrfTokenRepository = csrfTokenRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws ServletException, IOException {
        Optional<CsrfToken> csrfTokenOptional = getCsrfToken(request);
        if (csrfTokenOptional.isPresent()) {
            addCsrfCookie(csrfTokenOptional, request, response);
            csrfTokenRepository.saveToken(csrfTokenOptional.get(), request, response);
        }
    }

    private Optional<CsrfToken> getCsrfToken(HttpServletRequest request) {
        CSRFConfig csrfConfig = WMAppContext.getInstance().getSpringBean(CSRFConfig.class);
        if (csrfConfig != null && csrfConfig.isEnforceCsrfSecurity()) {
            CsrfToken csrfToken = csrfTokenRepository.generateToken(request);
            return Optional.ofNullable(csrfToken);
        }
        return Optional.empty();
    }

    private void addCsrfCookie(Optional<CsrfToken> csrfTokenOptional, HttpServletRequest request, HttpServletResponse response) {
        logger.info("Adding CsrfCookie");
        CsrfToken csrfToken = csrfTokenOptional.get();
        Cookie cookie = new Cookie(SecurityConfigConstants.WM_CSRF_TOKEN_COOKIE, csrfToken.getToken());
        String contextPath = request.getContextPath();
        if (StringUtils.isBlank(contextPath)) {
            contextPath = "/";
        }
        cookie.setPath(contextPath);
        cookie.setSecure(request.isSecure());
        response.addCookie(cookie);
    }

    public void setCsrfTokenRepository(CsrfTokenRepository csrfTokenRepository) {
        this.csrfTokenRepository = csrfTokenRepository;
    }

}
