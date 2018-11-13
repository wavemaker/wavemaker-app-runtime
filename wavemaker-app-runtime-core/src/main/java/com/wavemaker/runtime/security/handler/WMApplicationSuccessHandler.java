package com.wavemaker.runtime.security.handler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.security.WMAuthentication;

/**
 * Created by srujant on 31/10/18.
 */
public class WMApplicationSuccessHandler implements AuthenticationSuccessHandler, BeanPostProcessor {

    private List<AuthenticationSuccessHandler> defaultSuccessHandlerList;
    private List<WMAuthenticationSuccessHandler> customSuccessHandlerList = new ArrayList<>();

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws ServletException, IOException {
        authentication = new WMAuthentication(authentication);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        try {
            invokeDefaultAuthenticationSuccessHandlers(request, response, authentication);
            invokeCustomWMAuthenticationSuccessHandler(request, response, (WMAuthentication) authentication);
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new WMRuntimeException(e);
        }
    }

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof WMApplicationSuccessHandler) {
            customSuccessHandlerList.add((WMAuthenticationSuccessHandler) bean);
        }
        return bean;
    }

    private void invokeCustomWMAuthenticationSuccessHandler(HttpServletRequest request, HttpServletResponse response, WMAuthentication authentication) throws IOException, ServletException {
        for (WMAuthenticationSuccessHandler authenticationSuccessHandler : customSuccessHandlerList) {
            authenticationSuccessHandler.onAuthenticationSuccess(request, response, authentication);
        }
    }

    private void invokeDefaultAuthenticationSuccessHandlers(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        for (AuthenticationSuccessHandler authenticationSuccessHandler : defaultSuccessHandlerList) {
            authenticationSuccessHandler.onAuthenticationSuccess(request, response, authentication);
        }
    }

    public void setDefaultSuccessHandlerList(List<AuthenticationSuccessHandler> defaultSuccessHandlerList) {
        this.defaultSuccessHandlerList = defaultSuccessHandlerList;
    }


    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        return bean;
    }
}
