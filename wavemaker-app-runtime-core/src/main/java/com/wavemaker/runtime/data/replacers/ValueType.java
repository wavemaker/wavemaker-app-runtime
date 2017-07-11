package com.wavemaker.runtime.data.replacers;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.system.AppEnvironmentVariableValueProvider;
import com.wavemaker.runtime.system.ServerVariableValueProvider;

/**
 * @author Ravali Koppaka
 * @since 6/7/17
 */

public enum ValueType {

    PROMPT {
        @Override
        public <T> T getValue(String key, Class<T> fieldType) {
            return null;
        }
    },
    SERVER {
        @Override
        public <T> T getValue(String key, Class<T> fieldType) {
            final ServerVariableValueProvider provider = WMAppContext.getInstance()
                    .getSpringBean(ServerVariableValueProvider.class);
            return provider.getValue(key, fieldType);
        }
    },
    APP_ENVIRONMENT {
        @Override
        public <T> T getValue(String key, Class<T> fieldType) {
            final AppEnvironmentVariableValueProvider provider = WMAppContext.getInstance()
                    .getSpringBean(AppEnvironmentVariableValueProvider.class);
            return provider.getValue(key, fieldType);
        }
    };

    public abstract <T> T getValue(String key, final Class<T> fieldType);
}