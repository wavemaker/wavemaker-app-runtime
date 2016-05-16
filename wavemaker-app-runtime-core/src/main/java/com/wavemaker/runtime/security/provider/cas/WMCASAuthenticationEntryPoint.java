package com.wavemaker.runtime.security.provider.cas;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.cas.ServiceProperties;
import org.springframework.security.cas.web.CasAuthenticationEntryPoint;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Created by ArjunSahasranam on 5/16/16.
 */
public class WMCASAuthenticationEntryPoint extends CasAuthenticationEntryPoint {

    @Autowired
    @Qualifier("casServiceProperties")
    private ServiceProperties serviceProperties;

    @Override
    protected String createServiceUrl(HttpServletRequest request, HttpServletResponse response) {
        StringBuffer requestURL = request.getRequestURL();
        String contextPath = request.getContextPath();

        String serviceHostUrl = requestURL.substring(0, requestURL.indexOf(contextPath));
        String serviceUrl = serviceHostUrl + contextPath + "/j_spring_cas_security_check";
        if(StringUtils.isBlank(serviceProperties.getService())){
            serviceProperties.setService(serviceUrl);
        }
        return super.createServiceUrl(request, response);
    }
}
