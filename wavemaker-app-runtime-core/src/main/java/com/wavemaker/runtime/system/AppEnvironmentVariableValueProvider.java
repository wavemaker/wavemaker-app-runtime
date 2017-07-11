package com.wavemaker.runtime.system;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 10/7/17
 */
@Component
public class AppEnvironmentVariableValueProvider implements VariableValueProvider {

    private static final String APP_ENVIRONMENT_PROPERTY_PREFIX = "app.environment.";

    private final Environment environment;

    @Autowired
    public AppEnvironmentVariableValueProvider(final Environment environment) {
        this.environment = environment;
    }

    @Override
    public Object getValue(final String variableName) {
        if (environment.containsProperty(APP_ENVIRONMENT_PROPERTY_PREFIX + variableName)) {
            return environment.getProperty(APP_ENVIRONMENT_PROPERTY_PREFIX + variableName);
        }
        throw new IllegalArgumentException("Environment property not found with key:" + variableName);
    }
}
