package com.wavemaker.runtime.oauth;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanPostProcessor;

import com.wavemaker.commons.oauth.OAuthProviderConfig;
import com.wavemaker.runtime.oauth.service.OAuthRuntimeServiceManager;

/**
 * Created by srujant on 18/7/17.
 */
public class OAuthServiceBeanPostProcessor implements BeanPostProcessor {

    @Autowired
    private OAuthRuntimeServiceManager oAuthRuntimeServiceManager;

    @Override
    public Object postProcessBeforeInitialization(Object bean, String s) throws BeansException {
        if (bean instanceof OAuthProviderConfig) {
            OAuthProviderConfig oAuthProviderConfig = (OAuthProviderConfig) bean;
            oAuthRuntimeServiceManager.addOAuthProviderConfig(oAuthProviderConfig);
        }
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String s) throws BeansException {
        return bean;
    }
}
