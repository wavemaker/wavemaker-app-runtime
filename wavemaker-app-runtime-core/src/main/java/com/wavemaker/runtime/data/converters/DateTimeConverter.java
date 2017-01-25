package com.wavemaker.runtime.data.converters;

import java.sql.Timestamp;
import java.util.Date;

import org.joda.time.LocalDateTime;

import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.commons.json.deserializer.WMLocalDateTimeDeSerializer;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public class DateTimeConverter implements JavaTypeConverter {
    @Override
    public Object fromString(final String value) {
        return WMLocalDateTimeDeSerializer.getLocalDateTime(value);
    }

    @Override
    public Object fromDbValue(final Object fromValue) {
        if (fromValue == null) {
            return null;
        }
        if (Timestamp.class.isInstance(fromValue)) {
            Timestamp timestamp = ((Timestamp) fromValue);
            Date date = new Date(timestamp.getTime());
            return LocalDateTime.fromDateFields(date);
        }
        if (Date.class.isInstance(fromValue)) {
            return LocalDateTime.fromDateFields(((Date) fromValue));
        }
        return WMLocalDateTimeDeSerializer.getLocalDateTime(String.valueOf(fromValue));
    }

    @Override
    public Object toDbValue(final Object value, final Class<?> toType) {
        if (value instanceof LocalDateTime) {
            Timestamp timeStamp = Timestamp.valueOf(((LocalDateTime) value).toString("yyyy-mm-dd hh:mm:ss"));
            return JavaType.TIMESTAMP.toDbValue(timeStamp);
        }
        return value;
    }
}
