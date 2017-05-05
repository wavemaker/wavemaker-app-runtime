package com.wavemaker.runtime.data.converters;

import java.sql.Blob;

import org.hibernate.type.BlobType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 23/2/17
 */
public class BlobTypeConverter extends HibernateBackedJavaTypeConverter {
    public BlobTypeConverter() {
        super(BlobType.INSTANCE.getJavaTypeDescriptor());
    }

    @Override
    public Object fromDbValue(final Object value) {
        if (value instanceof Blob) {
            return toDbValue(value, byte[].class);
        } else {
            return value;
        }
    }

    @Override
    public Object toDbValue(final Object value, final Class<?> toType) {
        return value instanceof Blob ? super.toDbValue(value, toType) : value;
    }
}
