package com.wavemaker.runtime.security.provider.cas;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.jasig.cas.client.util.CommonUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.cas.ServiceProperties;
import org.springframework.security.core.AuthenticationException;

import com.wavemaker.runtime.util.HttpRequestUtils;

/**
 * Created by ArjunSahasranam on 5/16/16.
 */
public class WMCASAuthenticationEntryPoint extends SpringCasAuthenticationEntryPoint {

    @Autowired
    @Qualifier("casServiceProperties")
    private ServiceProperties serviceProperties;

    protected String createServiceUrl(HttpServletRequest request, HttpServletResponse response) {
        if (StringUtils.isBlank(serviceProperties.getService())) {
            String serviceUrl = HttpRequestUtils.getServiceUrl(request);
            serviceProperties.setService(serviceUrl + "/j_spring_cas_security_check");
        }
        return CommonUtils.constructServiceUrl(null, response, this.serviceProperties.getService(), null,
                this.serviceProperties.getArtifactParameter(), true);
    }

    public final void commence(final HttpServletRequest servletRequest, final HttpServletResponse response,
                               final AuthenticationException authenticationException) throws IOException, ServletException {
        if (HttpRequestUtils.isAjaxRequest(servletRequest)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
        } else {
            final String urlEncodedService = createServiceUrl(servletRequest, response);
            final String redirectUrl = createRedirectUrl(urlEncodedService);
            preCommence(servletRequest, response);
            response.sendRedirect(redirectUrl);
        }
    }


}
