package com.wavemaker.runtime.data.converters;

import org.hibernate.type.descriptor.java.JavaTypeDescriptor;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public class HibernateBackedJavaTypeConverter implements JavaTypeConverter {

    private JavaTypeDescriptor descriptor;

    public HibernateBackedJavaTypeConverter(final JavaTypeDescriptor descriptor) {
        this.descriptor = descriptor;
    }

    @Override
    public Object fromString(final String value) {
        return descriptor.fromString(value);
    }

    @Override
    public Object fromDbValue(final Object value) {
        return descriptor.wrap(value, null);
    }

    @SuppressWarnings("unchecked")
    @Override
    public Object toDbValue(final Object value, Class<?> toType) {
        return descriptor.unwrap(value, toType, null);
    }
}
