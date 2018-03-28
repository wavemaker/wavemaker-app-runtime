package com.wavemaker.runtime.filter.gzip;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.web.filter.GenericFilterBean;

/**
 * This filter enables the gzip compression of responses
 *
 * @author Kishore Routhu on 10/10/17 7:04 PM.
 */
public class GZipCompressionFilter extends GenericFilterBean {

    @Autowired
    private GZipFilterConfig filterConfig;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;
        if (isGzipCompressionRequired(httpServletRequest, httpServletResponse)) {
            GZipServletResponseWrapper gZipResponseWrapper = new GZipServletResponseWrapper(filterConfig, httpServletResponse);
            chain.doFilter(request, gZipResponseWrapper);
            gZipResponseWrapper.close();
        } else {
            chain.doFilter(request, response);
        }
    }

    private boolean isGzipCompressionRequired(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {

        if (!filterConfig.isEnableGZipCompression()) {
            return false;
        }

        if (!isGzipAccepted(httpServletRequest)) {
            return false;
        }

        return true;
    }

    private boolean isGzipAccepted(HttpServletRequest httpServletRequest) {
        String value = httpServletRequest.getHeader(HttpHeaders.ACCEPT_ENCODING);
        return ((value != null) && value.toLowerCase().contains("gzip"));
    }
}
