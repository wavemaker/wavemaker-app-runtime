package com.wavemaker.runtime.data.converters;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public class ObjectTypeConverter implements JavaTypeConverter {
    @Override
    public Object fromString(final String value) {
        return value;
    }

    @Override
    public Object fromDbValue(final Object value) {
        return value;
    }

    @Override
    public Object toDbValue(final Object value, final Class<?> toType) {
        return value;
    }
}
