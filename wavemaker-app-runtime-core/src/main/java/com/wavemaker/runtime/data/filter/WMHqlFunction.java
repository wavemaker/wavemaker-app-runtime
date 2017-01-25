package com.wavemaker.runtime.data.filter;

import java.sql.Timestamp;

import com.wavemaker.commons.json.deserializer.WMLocalDateTimeDeSerializer;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/12/16
 */
public enum WMHqlFunction {
    DT {
        @Override
        public Object convertValue(final String fromValue) {
            return WMLocalDateTimeDeSerializer.getLocalDateTime(fromValue);
        }
    },
    TS {
        @Override
        public Object convertValue(final String fromValue) {
            return new Timestamp(Long.valueOf(fromValue));
        }
    },
    FLOAT {
        @Override
        public Object convertValue(final String fromValue) {
            return Float.valueOf(fromValue);
        }
    };

    public abstract Object convertValue(String fromValue);
}
