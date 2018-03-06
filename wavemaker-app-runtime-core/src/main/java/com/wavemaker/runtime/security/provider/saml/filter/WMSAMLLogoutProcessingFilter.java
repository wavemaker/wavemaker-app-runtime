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
package com.wavemaker.runtime.security.provider.saml.filter;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.opensaml.saml2.metadata.provider.MetadataProviderException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.saml.SAMLLogoutProcessingFilter;
import org.springframework.security.saml.context.SAMLMessageContext;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

import com.wavemaker.runtime.security.provider.saml.SAMLConfig;
import com.wavemaker.runtime.security.provider.saml.SAMLHttpServletRequestWrapper;

import static com.wavemaker.runtime.security.provider.saml.SAMLHttpServletRequestWrapper.EndpointType.SLO;


public class WMSAMLLogoutProcessingFilter extends SAMLLogoutProcessingFilter {

    @Autowired
    private SAMLConfig samlConfig;

    /**
     * Constructor defines URL to redirect to after successful logout and handlers.
     *
     * @param logoutSuccessUrl user will be redirected to the url after successful logout
     * @param handlers handlers to invoke after logout
     */
    public WMSAMLLogoutProcessingFilter(String logoutSuccessUrl, LogoutHandler... handlers) {
        super(logoutSuccessUrl, handlers);
    }

    /**
     * Constructor uses custom implementation for determining URL to redirect after successful logout.
     *
     * @param logoutSuccessHandler custom implementation of the logout logic
     * @param handlers handlers to invoke after logout
     */
    public WMSAMLLogoutProcessingFilter(LogoutSuccessHandler logoutSuccessHandler, LogoutHandler... handlers) {
        super(logoutSuccessHandler, handlers);
    }

    @Override
    public void processLogout(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws IOException, ServletException {

        if (requiresLogout(request, response)) {
            if (SAMLConfig.ValidateType.RELAXED == samlConfig.getValidateType()) {
                SAMLMessageContext context = null;
                try {
                    context = contextProvider.getLocalEntity(request, response);
                } catch (MetadataProviderException e) {
                    logger.debug("Error determining metadata contracts", e);
                    throw new ServletException("Error determining metadata contracts", e);
                }
                SAMLHttpServletRequestWrapper requestWrapper = new SAMLHttpServletRequestWrapper(request, context, SLO);
                super.processLogout(requestWrapper, response, chain);
            } else {
                super.processLogout(request, response, chain);
            }
        }
    }
}