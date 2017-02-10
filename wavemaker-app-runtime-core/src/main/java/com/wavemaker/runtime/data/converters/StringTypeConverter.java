package com.wavemaker.runtime.data.converters;

import org.hibernate.HibernateException;
import org.hibernate.type.StringType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 10/2/17
 */
public class StringTypeConverter extends HibernateBackedJavaTypeConverter {
    private static final Logger LOGGER = LoggerFactory.getLogger(StringTypeConverter.class);

    public StringTypeConverter() {
        super(StringType.INSTANCE.getJavaTypeDescriptor());
    }

    @Override
    public Object fromDbValue(final Object value) {
        try {
            return super.fromDbValue(value);
        } catch (HibernateException e) {
            LOGGER.debug("Not a string instance type, using String.valueOf for conversion", e.getMessage());
            return String.valueOf(value);
        }
    }
}
