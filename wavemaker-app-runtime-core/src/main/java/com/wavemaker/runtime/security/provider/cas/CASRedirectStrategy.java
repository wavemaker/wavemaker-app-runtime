package com.wavemaker.runtime.security.provider.cas;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.web.DefaultRedirectStrategy;

/**
 * Created by ArjunSahasranam on 1/6/16.
 */
public class CASRedirectStrategy extends DefaultRedirectStrategy {

    private static final Logger LOGGER = LoggerFactory.getLogger(CASRedirectStrategy.class);

    @Override
    public void sendRedirect(HttpServletRequest request, HttpServletResponse response, String url) throws IOException {

        StringBuffer requestURL = request.getRequestURL();
        String contextPath = request.getContextPath();

        String serviceHostUrl = requestURL.substring(0, requestURL.lastIndexOf(contextPath));
        String serviceUrl = serviceHostUrl + contextPath;

        StringBuilder stringBuilder = new StringBuilder(url);
        stringBuilder.append("?service=" + serviceUrl);

        LOGGER.info("CAS logout redirect url is {}", url);
        String casRedirectUrl = stringBuilder.toString();
        if (!isAjaxRequest(request)) {
            super.sendRedirect(request, response, casRedirectUrl);
        } else {
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(casRedirectUrl);
            response.getWriter().flush();
        }
    }

    private boolean isAjaxRequest(HttpServletRequest request) {
        return "XMLHttpRequest".equals(request.getHeader("X-Requested-With"));
    }
}
