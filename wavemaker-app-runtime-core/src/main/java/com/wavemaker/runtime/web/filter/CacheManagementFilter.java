package com.wavemaker.runtime.web.filter;

import java.io.IOException;

import javax.annotation.PostConstruct;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.GenericFilterBean;

import com.wavemaker.commons.web.filter.EtagFilter;
import com.wavemaker.runtime.filter.etag.CacheFilterConfig;

/**
 * Created by srujant on 27/3/19.
 */
public class CacheManagementFilter extends GenericFilterBean {


    @Autowired
    private EtagFilter etagFilter;

    @Autowired
    private CacheFilterConfig cacheFilterConfig;

    private RequestMatcher cacheRequestMatcher;
    private RequestMatcher etagRequestMatcher;

    @PostConstruct
    private void init() {
        cacheRequestMatcher = cacheFilterConfig.getCacheRequestMatcher();
        etagRequestMatcher = cacheFilterConfig.getEtagRequestMatcher();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;
        if (matches(httpServletRequest, cacheRequestMatcher)) {
            httpServletResponse.addHeader("Cache-Control", "public, max-age=1296000");
            chain.doFilter(request, new HttpServletResponseWrapper(httpServletResponse) {
                public void setHeader(String name, String value) {
                    if (!"etag".equalsIgnoreCase(name) && !"Last-Modified".equalsIgnoreCase(name)) {
                        super.setHeader(name, value);
                    }
                }
            });
        } else if (matches(httpServletRequest, etagRequestMatcher)) {
            etagFilter.doFilter(request, response, chain);
        } else {
            httpServletResponse.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1
            httpServletResponse.setHeader("Pragma", "no-cache"); // HTTP 1.0
            httpServletResponse.setDateHeader("Expires", 0);
            chain.doFilter(request, response);
        }
    }


    private boolean matches(HttpServletRequest httpServletRequest, RequestMatcher requestMatcher) {
        return requestMatcher == null ? false : requestMatcher.matches(httpServletRequest);
    }

}
