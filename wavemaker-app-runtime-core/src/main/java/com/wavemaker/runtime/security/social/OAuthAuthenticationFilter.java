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
package com.wavemaker.runtime.security.social;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.social.connect.UsersConnectionRepository;
import org.springframework.social.security.SocialAuthenticationFilter;
import org.springframework.social.security.SocialAuthenticationServiceLocator;

/**
 * @author Uday Shankar
 */
public class OAuthAuthenticationFilter extends SocialAuthenticationFilter {

    public OAuthAuthenticationFilter(
            AuthenticationManager authManager, SocialAuthenticationServiceLocator authServiceLocator) {
        this(authManager, null, authServiceLocator);
    }

    public OAuthAuthenticationFilter(
            AuthenticationManager authManager, UsersConnectionRepository usersConnectionRepository,
            SocialAuthenticationServiceLocator authServiceLocator) {
        super(authManager, null, usersConnectionRepository, authServiceLocator);
        setUpdateConnections(false);
    }

    @Override
    protected boolean requiresAuthentication(HttpServletRequest request, HttpServletResponse response) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth == null || !auth.isAuthenticated()) && super.requiresAuthentication(request, response);

    }
}
