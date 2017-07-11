package com.wavemaker.runtime.data.replacers.providers;

import java.beans.PropertyDescriptor;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.util.Map;
import java.util.Set;

import com.google.common.collect.Sets;
import com.wavemaker.runtime.data.annotations.WMValueInject;
import com.wavemaker.runtime.data.replacers.ListenerContext;
import com.wavemaker.runtime.data.replacers.Scope;
import com.wavemaker.runtime.data.replacers.ValueProvider;
import com.wavemaker.runtime.data.replacers.ValueProviderBuilder;
import com.wavemaker.runtime.data.replacers.ValueType;

/**
 * @author Ravali Koppaka
 * @since 6/7/17
 */

public class VariableDefinedPropertyProvider implements ValueProvider {

    private final ValueType valueType;

    private final String key;

    private final Class<?> fieldType;

    private final Set<Scope> scopes;

    public VariableDefinedPropertyProvider(final ValueType valueType, final String key, final Class<?> fieldType, final Set<Scope> scopes) {
        this.valueType = valueType;
        this.key = key;
        this.fieldType = fieldType;
        this.scopes = scopes;
    }

    @Override
    public Object getValue(ListenerContext context) {
        return valueType.getValue(key,fieldType);
    }

    @Override
    public Set<Scope> scopes() {
        return scopes;
    }

    public static class VariableDefinedPropertyProviderBuilder implements ValueProviderBuilder {

        @Override
        public ValueProvider build(Field field, Map<Field, PropertyDescriptor> fieldDescriptorMap, Annotation annotation) {
            WMValueInject provider = (WMValueInject) annotation;
            return new VariableDefinedPropertyProvider(provider.type(), provider.name(), field.getType(),
                    Sets.newHashSet(provider.scopes()));
        }

    }
}
