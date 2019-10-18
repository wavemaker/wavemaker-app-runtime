/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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
package com.wavemaker.runtime.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationListener;
import org.springframework.security.web.session.HttpSessionCreatedEvent;
import org.springframework.security.web.session.HttpSessionEventPublisher;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.config.WMAppSecurityConfig;

/**
 * Listens to {@link HttpSessionCreatedEvent} from {@link HttpSessionEventPublisher}
 *
 * Created by ArjunSahasranam on 23/9/16.
 */
public class AppRuntimeSessionListener implements ApplicationListener<HttpSessionCreatedEvent> {
    private static final Logger logger = LoggerFactory.getLogger(AppRuntimeSessionListener.class);

    private static final String WM_APP_SECURITY_CONFIG = "WMAppSecurityConfig";

    @Override
    public void onApplicationEvent(final HttpSessionCreatedEvent event) {
        WMAppSecurityConfig wmAppSecurityConfig = WMAppContext.getInstance().getSpringBean(WM_APP_SECURITY_CONFIG);
        if (wmAppSecurityConfig.isEnforceSecurity()) {
            int timeoutInSeconds = wmAppSecurityConfig.getLoginConfig().getSessionTimeout().getTimeoutValue() * 60;
            event.getSession().setMaxInactiveInterval(timeoutInSeconds);
            logger.debug("session inactive timeout set for {} seconds", timeoutInSeconds);
        }
    }
}
