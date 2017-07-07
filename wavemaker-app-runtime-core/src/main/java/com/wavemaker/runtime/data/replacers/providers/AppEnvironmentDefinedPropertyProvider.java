package com.wavemaker.runtime.data.replacers.providers;

import java.beans.PropertyDescriptor;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.util.Map;
import java.util.Set;

import com.google.common.collect.Sets;
import com.wavemaker.runtime.data.replacers.ListenerContext;
import com.wavemaker.runtime.data.replacers.Scope;
import com.wavemaker.runtime.data.replacers.ValueProvider;
import com.wavemaker.runtime.data.replacers.ValueProviderBuilder;
import com.wavemaker.runtime.data.replacers.ValueType;

/**
 * @author Ravali Koppaka
 * @since 6/7/17
 */

public class AppEnvironmentDefinedPropertyProvider implements ValueProvider {

    private final String key;
    private final Class<?> fieldType;
    private final Set<Scope> scopes;

    public AppEnvironmentDefinedPropertyProvider(final String key, final Class<?> fieldType, final Set<Scope> scopes) {
        this.key = key;
        this.fieldType = fieldType;
        this.scopes = scopes;
    }

    @Override
    public Object getValue(ListenerContext context) {
        return ValueType.APP_ENVIRONMENT.getValue(key,fieldType);
    }

    @Override
    public Set<Scope> scopes() {
        return scopes;
    }

    public static class AppEnvironmentProviderBuilder implements ValueProviderBuilder {

        @Override
        public ValueProvider build(Field field, Map<Field, PropertyDescriptor> fieldDescriptorMap, Annotation annotation) {
            com.wavemaker.runtime.data.annotations.ValueProvider provider = (com.wavemaker.runtime.data.annotations.ValueProvider)annotation;
            return new AppEnvironmentDefinedPropertyProvider(provider.key(), field.getType(),
                    Sets.newHashSet(provider.scopes()));
        }

    }
}
