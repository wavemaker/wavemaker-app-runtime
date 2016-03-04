/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
