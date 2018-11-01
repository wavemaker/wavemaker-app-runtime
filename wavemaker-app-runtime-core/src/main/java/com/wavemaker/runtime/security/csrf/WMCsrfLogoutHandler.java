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
package com.wavemaker.runtime.security.csrf;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;

import com.wavemaker.runtime.security.AbstractLogoutHandler;

/**
 * Created by kishorer on 13/7/16.
 */
public class WMCsrfLogoutHandler extends AbstractLogoutHandler {

    public WMCsrfLogoutHandler(LogoutHandler logoutHandler) {
        super(logoutHandler);
    }

    @Override
    protected void postLogout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        Cookie cookie = new Cookie(SecurityConfigConstants.WM_CSRF_TOKEN_COOKIE, null);
        cookie.setMaxAge(0);
        String contextPath = request.getContextPath();
        if (StringUtils.isBlank(contextPath)) {
            contextPath = "/";
        }
        cookie.setPath(contextPath);
        cookie.setSecure(request.isSecure());
        response.addCookie(cookie);
    }
}
