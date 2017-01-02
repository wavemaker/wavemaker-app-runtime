package com.wavemaker.runtime.security.provider.saml.filter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.opensaml.saml2.metadata.provider.MetadataProviderException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.saml.SAMLProcessingFilter;
import org.springframework.security.saml.context.SAMLMessageContext;

import com.wavemaker.runtime.security.provider.saml.SAMLConfig;
import com.wavemaker.runtime.security.provider.saml.SAMLHttpServletRequestWrapper;

import static com.wavemaker.runtime.security.provider.saml.SAMLHttpServletRequestWrapper.EndpointType.SSO;

/**
 * This class is similar to {@link SAMLProcessingFilter} but compares the local endpoints with the incoming request URL
 * in a 'RELAXED'
 * manner.
 *
 * Created by arjuns on 18/12/16.
 */
public class WMSAMLProcessingFilter extends SAMLProcessingFilter {

    @Autowired
    private SAMLConfig samlConfig;

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {

        if (SAMLConfig.ValidateType.RELAXED == samlConfig.getValidateType()) {
            final SAMLMessageContext context;
            try {
                context = contextProvider.getLocalEntity(request, response);
            } catch (MetadataProviderException e) {
                logger.debug("Error determining metadata contracts", e);
                throw new AuthenticationServiceException("Error determining metadata contracts", e);
            }
            SAMLHttpServletRequestWrapper requestWrapper = new SAMLHttpServletRequestWrapper(request, context, SSO);
            return super.attemptAuthentication(requestWrapper, response);
        } else {
            return super.attemptAuthentication(request, response);
        }
    }

}