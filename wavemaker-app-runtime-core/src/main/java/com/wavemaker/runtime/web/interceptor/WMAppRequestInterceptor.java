package com.wavemaker.runtime.web.interceptor;

import java.lang.annotation.Annotation;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.tools.apidocs.tools.core.annotation.WMAccessVisibility;
import com.wavemaker.tools.apidocs.tools.core.model.AccessSpecifier;

/**
 * @Author: sowmyad
 */
public class WMAppRequestInterceptor implements HandlerInterceptor{
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (handler instanceof HandlerMethod) {
            HandlerMethod handlerMethod = (HandlerMethod) handler;
            if (handlerMethod != null && handlerMethod.getMethod().getAnnotations() != null) {
                for (Annotation annotation : handlerMethod.getMethod().getAnnotations()) {
                    if(annotation instanceof WMAccessVisibility && ((WMAccessVisibility)annotation).value().equals(AccessSpecifier.UNAVAILABLE)){
                        throw new WMRuntimeException("Access denied for this method " + handlerMethod.getMethod().getName());
                    }
                }
            }
        }

        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
    }

}
