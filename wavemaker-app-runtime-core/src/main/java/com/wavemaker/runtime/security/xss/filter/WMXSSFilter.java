package com.wavemaker.runtime.security.xss.filter;

import java.io.IOException;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletRequestWrapper;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.filter.GenericFilterBean;

import com.wavemaker.runtime.security.xss.handler.XSSSecurityHandler;

/**
 * Created by kishorer on 20/8/15.
 */
public class WMXSSFilter extends GenericFilterBean {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        //Force XSS protection by the browser (useful if XSS protection was disabled by the user)
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;
        httpServletResponse.addHeader("X-XSS-Protection", "1");
        httpServletResponse.addHeader("mode", "block");
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        XSSSecurityHandler xssSecurityHandler = XSSSecurityHandler.getInstance();
        ServletRequestWrapper requestWrapper = xssSecurityHandler.getRequestWrapper(httpServletRequest);
        chain.doFilter(requestWrapper, httpServletResponse);
    }

    @Override
    public void destroy() {
    }
}
