package com.wavemaker.runtime.security.provider.cas;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.cas.ServiceProperties;
import org.springframework.security.web.DefaultRedirectStrategy;

import com.wavemaker.runtime.util.HttpRequestUtils;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.wrapper.StringWrapper;

/**
 * Created by ArjunSahasranam on 1/6/16.
 */
public class CASRedirectStrategy extends DefaultRedirectStrategy {

    private static final Logger LOGGER = LoggerFactory.getLogger(CASRedirectStrategy.class);

    @Autowired
    @Qualifier("casServiceProperties")
    private ServiceProperties serviceProperties;

    @Override
    public void sendRedirect(HttpServletRequest request, HttpServletResponse response, String url) throws IOException {
        if ("/".equals(url)) {
            super.sendRedirect(request, response, url);
        } else {
            String serviceUrl = HttpRequestUtils.getServiceUrl(request);
            StringBuilder stringBuilder = new StringBuilder(url);
            stringBuilder.append("?" + serviceProperties.getServiceParameter() + "=" + serviceUrl + "/");

            LOGGER.info("CAS logout redirect url is {}", url);
            String casRedirectUrl = stringBuilder.toString();
            if (HttpRequestUtils.isAjaxRequest(request)) {
                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write(JSONUtils.toJSON(new StringWrapper(casRedirectUrl)));
                response.getWriter().flush();
            } else {
                super.sendRedirect(request, response, casRedirectUrl);
            }
        }
    }

}
