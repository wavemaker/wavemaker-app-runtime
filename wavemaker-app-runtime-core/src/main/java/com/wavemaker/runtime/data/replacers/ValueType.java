package com.wavemaker.runtime.data.replacers;

import com.wavemaker.runtime.data.replacers.providers.VariableType;

/**
 * @author Ravali Koppaka
 * @since 6/7/17
 */

public enum ValueType {

    PROMPT {
        @Override
        public Object getValue(String key, Class<?> fieldType) {
            return null;
        }
    },
    SYSTEM {
        @Override
        public Object getValue(String key, Class<?> fieldType) {
            VariableType type = VariableType.valueOf(key);
            return type.getValue(fieldType);
        }
    },
    SERVER {
        @Override
        public Object getValue(String key, Class<?> fieldType) {
            VariableType type = VariableType.valueOf(key);
            return type.getValue(fieldType);
        }
    },
    APP_ENVIRONMENT {
        //TODO read values from app.properties
        @Override
        public Object getValue(String key, Class<?> fieldType) {
            return "app-environment";
        }
    };

    //TODO for SYSTEM and SERVER values should not be read from VariableType
    public abstract Object getValue(String key, final Class<?> fieldType);
}