package com.wavemaker.runtime.security.xss;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

import com.wavemaker.runtime.security.xss.handler.XSSSecurityHandler;

/**
 * Created by kishorer on 20/8/15.
 */
public  class XSSRequestWrapper extends HttpServletRequestWrapper {

    private XSSSecurityHandler xssSecurityHandler;

    public XSSRequestWrapper(HttpServletRequest request, XSSSecurityHandler xssSecurityHandler) {
        super(request);
        this.xssSecurityHandler = xssSecurityHandler;
    }

    @Override
    public String getParameter(String name) {
        String paramValue = super.getParameter(name);
        return xssSecurityHandler.sanitizeRequestData(paramValue);
    }

    @Override
    public String[] getParameterValues(String name) {
        String[] paramValues = super.getParameterValues(name);
        if (paramValues == null)
            return paramValues;
        int paramCount = paramValues.length;
        String[] escapedValues = new String[paramCount];
        for (int i = 0; i < paramCount; i++) {
            escapedValues[i] = xssSecurityHandler.sanitizeRequestData(paramValues[i]);
        }
        return escapedValues;
    }

    @Override
    public String getHeader(String name) {
        String headerValue = super.getHeader(name);
        return xssSecurityHandler.sanitizeRequestData(headerValue);
    }

}
