package com.wavemaker.runtime.security.provider.saml;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.saml.SAMLEntryPoint;
import org.springframework.security.saml.metadata.MetadataGenerator;

import com.wavemaker.runtime.util.HttpRequestUtils;

/**
 * Created by ArjunSahasranam on 27/10/16.
 */
public class WMSAMLEntryPoint extends SAMLEntryPoint {

    @Autowired
    private MetadataGenerator metadataGenerator;

    @Override
    public void commence(
            final HttpServletRequest request, final HttpServletResponse response,
            final AuthenticationException e) throws IOException, ServletException {
        if (HttpRequestUtils.isAjaxRequest(request)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        } else {
            final String entityBaseURL = metadataGenerator.getEntityBaseURL();
            if (StringUtils.isBlank(entityBaseURL)) {
                String serviceUrl = HttpRequestUtils.getServiceUrl(request);
                metadataGenerator.setEntityBaseURL(serviceUrl);
            }
            super.commence(request, response, e);
        }
    }
}
