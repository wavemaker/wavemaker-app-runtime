package com.wavemaker.runtime.data.converters;

import java.sql.Time;

import org.hibernate.type.TimeType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public class TimeTypeConverter extends HibernateBackedJavaTypeConverter {

    public TimeTypeConverter() {
        super(TimeType.INSTANCE.getJavaTypeDescriptor());
    }

    @Override
    public Object fromString(final String value) {
        final Object numberValue = ConverterUtil.toLongIfPossible(value);

        if (numberValue instanceof Long) {
            return new Time(((Long) numberValue));
        } else {
            return super.fromString(value);
        }
    }
}
