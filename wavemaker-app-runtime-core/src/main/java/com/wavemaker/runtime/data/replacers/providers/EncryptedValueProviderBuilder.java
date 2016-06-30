package com.wavemaker.runtime.data.replacers.providers;

import java.beans.PropertyDescriptor;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.util.Map;

import com.wavemaker.runtime.data.annotations.Encrypted;
import com.wavemaker.runtime.data.replacers.ValueProvider;
import com.wavemaker.runtime.data.replacers.ValueProviderBuilder;
import com.wavemaker.runtime.util.CryptoHelper;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public class EncryptedValueProviderBuilder implements ValueProviderBuilder {
    @Override
    public ValueProvider build(
            final Field field, final Map<Field, PropertyDescriptor> fieldDescriptorMap, final Annotation annotation) {
        final Encrypted encrypted = (Encrypted) annotation;
        CryptoHelper helper = new CryptoHelper(encrypted.algorithm(), encrypted.key());
        return new EncryptedValueProvider(fieldDescriptorMap.get(field), helper);
    }
}
