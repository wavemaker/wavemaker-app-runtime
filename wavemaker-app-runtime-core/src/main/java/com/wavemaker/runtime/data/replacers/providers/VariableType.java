package com.wavemaker.runtime.data.replacers.providers;

import java.lang.reflect.InvocationTargetException;
import java.sql.Time;
import java.util.Calendar;
import java.util.Date;

import org.joda.time.LocalDateTime;

import com.wavemaker.runtime.system.SystemDefinedPropertiesBean;
import com.wavemaker.studio.common.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 23/6/16
 */
public enum VariableType {
    NONE {
        @Override
        public Object getValue(final Class<?> fieldType) {
            return null;
        }
    },
    USER_ID {
        @Override
        public Object getValue(final Class<?> fieldType) {
            Object id = SystemDefinedPropertiesBean.getInstance().getCurrentUserId();

            if (!String.class.equals(fieldType)) {
                try {
                    id = fieldType.getMethod("valueOf", String.class).invoke(null, id);
                } catch (NoSuchMethodException | InvocationTargetException | IllegalAccessException e) {
                    throw new WMRuntimeException("Error while assigning value from Server defined property", e);
                }
            }

            return id;
        }
    },
    USER_NAME {
        @Override
        public Object getValue(final Class<?> fieldType) {
            return SystemDefinedPropertiesBean.getInstance().getCurrentUserName();
        }
    },
    DATE {
        @Override
        public Object getValue(final Class<?> fieldType) {
            return new Date(Calendar.getInstance().getTime().getTime());
        }
    },
    TIME {
        @Override
        public Object getValue(final Class<?> fieldType) {
            return new Time(Calendar.getInstance().getTime().getTime());
        }
    },
    DATE_TIME {
        @Override
        public Object getValue(final Class<?> fieldType) {
            return new LocalDateTime();
        }
    };

    public abstract Object getValue(final Class<?> fieldType);
}
