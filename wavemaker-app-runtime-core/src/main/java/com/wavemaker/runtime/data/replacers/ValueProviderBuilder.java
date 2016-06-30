package com.wavemaker.runtime.data.replacers;

import java.beans.PropertyDescriptor;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.util.Map;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public interface ValueProviderBuilder {

    ValueProvider build(
            final Field field, final Map<Field, PropertyDescriptor> fieldDescriptorMap, Annotation annotation);
}
