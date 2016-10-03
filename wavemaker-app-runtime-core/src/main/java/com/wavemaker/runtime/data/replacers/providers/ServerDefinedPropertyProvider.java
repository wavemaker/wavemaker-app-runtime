package com.wavemaker.runtime.data.replacers.providers;

import java.beans.PropertyDescriptor;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.util.Map;
import java.util.Set;

import com.google.common.collect.Sets;
import com.wavemaker.runtime.data.annotations.ServerDefinedProperty;
import com.wavemaker.runtime.data.replacers.ListenerContext;
import com.wavemaker.runtime.data.replacers.Scope;
import com.wavemaker.runtime.data.replacers.ValueProvider;
import com.wavemaker.runtime.data.replacers.ValueProviderBuilder;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 23/6/16
 */
public class ServerDefinedPropertyProvider implements ValueProvider {

    private final Set<Scope> scopes;
    private final VariableType type;
    private final Class<?> fieldType;

    public ServerDefinedPropertyProvider(final VariableType type, final Set<Scope> scopes, final Class<?> fieldType) {
        this.scopes = scopes;
        this.type = type;
        this.fieldType = fieldType;
    }


    @Override
    public Object getValue(final ListenerContext context) {
        return type.getValue(fieldType);
    }

    @Override
    public Set<Scope> scopes() {
        return scopes;
    }

    public static class SystemVariableProviderBuilder implements ValueProviderBuilder {

        @Override
        public ValueProvider build(
                final Field field, final Map<Field, PropertyDescriptor> fieldDescriptorMap,
                final Annotation annotation) {
            ServerDefinedProperty variable = ((ServerDefinedProperty) annotation);
            return new ServerDefinedPropertyProvider(variable.value(), Sets.newHashSet(variable.scopes()),
                    field.getType());
        }
    }
}
