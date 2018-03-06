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
import java.net.MalformedURLException;
import java.net.URL;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.opensaml.saml2.metadata.provider.MetadataProviderException;
import org.opensaml.ws.transport.http.HttpServletRequestAdapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.saml.SAMLEntryPoint;
import org.springframework.security.saml.context.SAMLMessageContext;
import org.springframework.security.saml.websso.WebSSOProfileOptions;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.util.HttpRequestUtils;

import static com.wavemaker.runtime.security.SecurityConstants.SESSION_NOT_FOUND;
import static com.wavemaker.runtime.security.SecurityConstants.X_WM_LOGIN_ERROR_MESSAGE;

/**
 * Created by ArjunSahasranam on 27/10/16.
 */
public class WMSAMLEntryPoint extends SAMLEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(WMSAMLEntryPoint.class);

    @Autowired
    private WebSSOProfileOptions webSSOProfileOptions;

    @Autowired
    private SAMLConfig samlConfig;

    @Override
    public void commence(final HttpServletRequest request,
                            final HttpServletResponse response,
                            final AuthenticationException e) throws IOException, ServletException {
        if (HttpRequestUtils.isAjaxRequest(request)) {
            response.setHeader(X_WM_LOGIN_ERROR_MESSAGE, SESSION_NOT_FOUND);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        } else {
            super.commence(request, response, e);
        }
    }

    @Override
    protected WebSSOProfileOptions getProfileOptions(SAMLMessageContext context, AuthenticationException exception) throws MetadataProviderException {
        WebSSOProfileOptions profileOptions = super.getProfileOptions(context, exception);

        HttpServletRequestAdapter requestAdapter = (HttpServletRequestAdapter) context.getInboundMessageTransport();
        HttpServletRequest request = requestAdapter.getWrappedRequest();
        StringBuffer requestURL = request.getRequestURL();
        logger.debug("Request URL is {} and RelayState is {}", requestURL.toString());

        try {
            URL incomingRequestUrl = new URL(requestURL.toString());
            String incomingRequestUrlPath = incomingRequestUrl.getPath(); //content after port,
            // excluding the query string, but starts with slash (/)

            int indexOfPath = requestURL.indexOf(incomingRequestUrlPath);
            StringBuffer requestUrlBeforePath = requestURL.delete(indexOfPath, requestURL.length());

            String[] partsInPath = StringUtils.split(incomingRequestUrlPath, "/");

            // taking first 2 parts from incomingRequestUrlPath. viz. run-xxx id and app name.
            String appRuntimePath = partsInPath[0];
            if (SAMLConfig.ValidateType.RELAXED == samlConfig.getValidateType()) {
                appRuntimePath = appRuntimePath.concat("/").concat(partsInPath[1]);
            }
            String appUrl = requestUrlBeforePath.toString().concat("/").concat(appRuntimePath);
            logger.debug("URL incomingRequestUrlPath constructed for application is {}", appUrl);

            String redirectPage = request.getParameter("redirectPage");
            if (StringUtils.isNotEmpty(redirectPage) && StringUtils.isNotEmpty(appUrl) && !StringUtils
                    .containsAny(appUrl, '#', '?')) {
                appUrl = appUrl.concat("#").concat(redirectPage);
            }
            profileOptions.setRelayState(appUrl);
            webSSOProfileOptions.setRelayState(appUrl);
        } catch (MalformedURLException e) {
            logger.error("Invalid URL {}", requestURL.toString(), e);
            throw new WMRuntimeException(e);
        }
        return profileOptions;
    }
}
