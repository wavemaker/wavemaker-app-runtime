package com.wavemaker.runtime.security.social;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.social.security.SocialAuthenticationServiceRegistry;
import org.springframework.social.security.provider.SocialAuthenticationService;

/**
 * @author Uday Shankar
 */
public class SocialAuthenticationServiceBeanPostProcessor implements BeanPostProcessor {

	@Autowired
	private SocialAuthenticationServiceRegistry socialAuthenticationServiceRegistry;

	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		if (bean instanceof SocialAuthenticationService) {
			SocialAuthenticationService socialAuthenticationService = (SocialAuthenticationService) bean;
			socialAuthenticationServiceRegistry.addAuthenticationService(socialAuthenticationService);
		}
		return bean;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}
}
