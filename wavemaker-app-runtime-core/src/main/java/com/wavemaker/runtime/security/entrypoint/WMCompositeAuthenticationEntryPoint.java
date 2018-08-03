package com.wavemaker.runtime.security.entrypoint;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;

/**
 * Created by srujant on 2/8/18.
 */
public class WMCompositeAuthenticationEntryPoint implements AuthenticationEntryPoint, BeanPostProcessor {

    private static final Logger logger = LoggerFactory.getLogger(WMCompositeAuthenticationEntryPoint.class);
    private List<AuthenticationEntryPoint> authenticationEntryPointList = new ArrayList<>();


    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        if (authenticationEntryPointList.size() == 1) {
            authenticationEntryPointList.get(0).commence(request, response, authException);
        } else if (authenticationEntryPointList.size() > 0) {
            logger.info("As no other AuthenticationEntryPoint is configured, commencing the request to index.html");
            LoginUrlAuthenticationEntryPoint loginUrlAuthenticationEntryPoint = new LoginUrlAuthenticationEntryPoint("/index.html");
            loginUrlAuthenticationEntryPoint.commence(request, response, authException);
        } else {
            throw new IllegalStateException();
        }
    }

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof FormLoginEntryPoint || bean instanceof SSOEntryPoint ) {
            authenticationEntryPointList.add((AuthenticationEntryPoint) bean);
        }
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        return bean;
    }
}
