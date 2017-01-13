package com.wavemaker.runtime.data.converters;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public interface JavaTypeConverter {

    Object fromString(String value);

    Object fromDbValue(Object value);

    Object toDbValue(Object value, Class<?> toType);
}
