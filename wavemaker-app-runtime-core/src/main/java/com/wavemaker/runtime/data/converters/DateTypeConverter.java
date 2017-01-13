package com.wavemaker.runtime.data.converters;

import java.util.Date;

import org.hibernate.type.DateType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public class DateTypeConverter extends HibernateBackedJavaTypeConverter {
    public DateTypeConverter() {
        super(DateType.INSTANCE.getJavaTypeDescriptor());
    }

    @Override
    public Object fromString(final String value) {
        final Object numberValue = ConverterUtil.toLongIfPossible(value);

        if (numberValue instanceof Long) {
            return new Date(((Long) numberValue));
        } else {
            return super.fromString(value);
        }
    }
}
