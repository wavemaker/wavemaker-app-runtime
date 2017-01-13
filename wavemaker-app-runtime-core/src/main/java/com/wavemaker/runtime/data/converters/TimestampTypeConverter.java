package com.wavemaker.runtime.data.converters;

import java.sql.Timestamp;

import org.hibernate.type.TimestampType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public class TimestampTypeConverter extends HibernateBackedJavaTypeConverter {

    public TimestampTypeConverter() {
        super(TimestampType.INSTANCE.getJavaTypeDescriptor());
    }

    @Override
    public Object fromString(final String value) {
        final Object numberValue = ConverterUtil.toLongIfPossible(value);

        if (numberValue instanceof Long) {
            return new Timestamp((Long) numberValue);
        } else {
            return super.fromString(value);
        }
    }
}
