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
package com.wavemaker.runtime.security.rememberme;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;

import com.wavemaker.runtime.security.config.WMAppSecurityConfig;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 22/1/16
 */
public class WMAppRememberMeServices extends TokenBasedRememberMeServices {

    public static final String REMEMBER_ME_PARAMETER = "remember-me";

    @Autowired
    private WMAppSecurityConfig securityConfig;

    public WMAppRememberMeServices(final String key, final UserDetailsService userDetailsService) {
        super(key, userDetailsService);
        init();
    }

    protected void init() {
        setParameter(REMEMBER_ME_PARAMETER);
    }

    @Override
    protected String extractRememberMeCookie(HttpServletRequest request) {
        if (rememberMeEnabled()) {
            return super.extractRememberMeCookie(request);
        }
        return null;
    }

    @Override
    public void onLoginSuccess(HttpServletRequest request, HttpServletResponse response,
                               Authentication successfulAuthentication) {
        if (rememberMeEnabled()) {
            super.onLoginSuccess(request, response, successfulAuthentication);
        }
    }

    public String getParameter() {
        return REMEMBER_ME_PARAMETER;
    }

    private boolean rememberMeEnabled() {
        return securityConfig.getRememberMeConfig() != null && securityConfig.getRememberMeConfig().isEnabled();
    }

}
