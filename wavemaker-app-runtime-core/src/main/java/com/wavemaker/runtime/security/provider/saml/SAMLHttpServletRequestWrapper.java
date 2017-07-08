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

import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

import org.opensaml.saml2.metadata.AssertionConsumerService;
import org.opensaml.saml2.metadata.SPSSODescriptor;
import org.opensaml.saml2.metadata.SingleLogoutService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.saml.context.SAMLMessageContext;

import static com.wavemaker.runtime.security.provider.saml.SAMLConstants.SAML_2_0_PROTOCOL;

/**
 * Created by arjuns on 18/1/17.
 */
public class SAMLHttpServletRequestWrapper extends HttpServletRequestWrapper {

    private static final Logger logger = LoggerFactory.getLogger(SAMLHttpServletRequestWrapper.class);

    private SAMLMessageContext context;
    private EndpointType endpointType;

    public enum EndpointType {
        SSO, // Single Sign-on Service
        SLO  // Single Logout Service
    }

    /**
     * Constructs a request object wrapping the given request.
     *
     * @param request
     * @throws IllegalArgumentException if the request is null
     */
    public SAMLHttpServletRequestWrapper(HttpServletRequest request, SAMLMessageContext context, EndpointType endpointType) {
        super(request);
        this.context = context;
        this.endpointType = endpointType;
    }

    @Override
    public StringBuffer getRequestURL() {
        SPSSODescriptor spssoDescriptor = context.getLocalEntityMetadata().getSPSSODescriptor(SAML_2_0_PROTOCOL);
        String endPoint = null;
        if (EndpointType.SSO == this.endpointType) {
            endPoint = getEndpoint(spssoDescriptor.getAssertionConsumerServices());
        } else {
            endPoint = getSLOEndpoint(spssoDescriptor.getSingleLogoutServices());
        }
        logger.debug("Endpoint is {} and Url is {}", endpointType, endPoint);
        return new StringBuffer(endPoint);
    }

    protected String getEndpoint(final List<AssertionConsumerService> endpoints) {
        return endpoints.get(0).getLocation();
    }

    protected String getSLOEndpoint(final List<SingleLogoutService> endpoints) {
        return endpoints.get(0).getLocation();
    }
}
