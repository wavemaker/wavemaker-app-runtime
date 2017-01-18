package com.wavemaker.runtime.rest.processor.response;

import java.net.HttpCookie;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

import com.wavemaker.runtime.rest.model.HttpResponseDetails;
import com.wavemaker.runtime.rest.util.HttpResponseUtils;

/**
 * @author Uday Shankar
 */
public class UpdateCookiePathHttpResponseProcessor implements HttpResponseProcessor {

    @Override
    public void process(HttpResponseProcessorContext httpResponseProcessorContext) {
        HttpResponseDetails httpResponseDetails = httpResponseProcessorContext.getHttpResponseDetails();
        List<HttpCookie> cookies = HttpResponseUtils.getCookies(httpResponseDetails);
        String cookiePath = getCookiePath(httpResponseProcessorContext.getHttpServletRequest());
        if (StringUtils.isNotBlank(cookiePath) && CollectionUtils.isNotEmpty(cookies)) {
            for (HttpCookie httpCookie : cookies) {
                httpCookie.setPath(cookiePath);//Updates path
            }
            HttpResponseUtils.setCookies(httpResponseDetails, cookies);
        }
    }

    private String getCookiePath(HttpServletRequest httpServletRequest) {
        StringBuilder sb = new StringBuilder();
        if (StringUtils.isNotBlank(httpServletRequest.getContextPath())) {
            sb.append(httpServletRequest.getContextPath());
        }

        if (StringUtils.isNotBlank(httpServletRequest.getServletPath())) {
            sb.append(httpServletRequest.getServletPath());
        }

        if (StringUtils.isNotBlank(httpServletRequest.getPathInfo())) {
            sb.append(httpServletRequest.getPathInfo());
        }
        return sb.toString();
    }
}
