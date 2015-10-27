package com.wavemaker.runtime.rest.handler;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.config.BeanPostProcessor;

import com.wavemaker.runtime.rest.model.RestServiceInfoBean;

/**
 * Created by ArjunSahasranam on 6/10/15.
 */

/**
 * Registers REST API urls to SimpleUrlHandlerMapping.
 */
public class RestServiceBeanPostProcessor implements BeanPostProcessor {


    private static final String REST_RUNTIME_CONTROLLER = "restRuntimeController";

    @Autowired
    @Qualifier("restServiceSimpleUrlHandlerMapping")
    private RestServiceSimpleUrlHandlerMapping restServiceSimpleUrlHandlerMapping;

    @Override
    public Object postProcessBeforeInitialization(final Object bean, final String beanName) throws BeansException {
        if (bean instanceof RestServiceInfoBean) {
            RestServiceInfoBean restServiceInfoBean = (RestServiceInfoBean) bean;
            restServiceSimpleUrlHandlerMapping.addRestServiceInfoBean(restServiceInfoBean, REST_RUNTIME_CONTROLLER);
            restServiceSimpleUrlHandlerMapping.initApplicationContext();
        }
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(final Object bean, final String beanName) throws BeansException {
        return bean;
    }
}
