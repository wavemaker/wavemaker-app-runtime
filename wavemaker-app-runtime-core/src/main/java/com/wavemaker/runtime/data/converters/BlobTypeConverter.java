package com.wavemaker.runtime.data.converters;

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
        return toDbValue(value, byte[].class);
    }
}
