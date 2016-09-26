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
        int timeoutInSeconds = wmAppSecurityConfig.getLoginConfig().getSessionTimeout().getTimeoutValue() * 60;
        event.getSession().setMaxInactiveInterval(timeoutInSeconds);
        logger.info("session inactive time timeoutInSeconds set at {}", timeoutInSeconds);
    }
}
