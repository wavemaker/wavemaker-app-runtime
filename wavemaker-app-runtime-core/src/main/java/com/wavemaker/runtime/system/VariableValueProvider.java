package com.wavemaker.runtime.system;

import com.wavemaker.runtime.data.util.JavaTypeUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 10/7/17
 */
public interface VariableValueProvider {

    @SuppressWarnings("unchecked")
    default <T> T getValue(String variableName, Class<T> requiredType) {
        return (T) JavaTypeUtils.convert(requiredType.getCanonicalName(), getValue(variableName));
    }

    Object getValue(String variableName);

}
