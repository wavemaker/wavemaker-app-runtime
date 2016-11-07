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

        @Override
        public boolean isSystemVariable() {
            return false;
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

    private static final String CURRENT_DATE = "CURRENT_DATE";
    private static final String CURRENT_TIME = "CURRENT_TIME";
    private static final String CURRENT_USER_NAME = "CURRENT_USER_NAME";
    private static final String CURRENT_USER_ID = "CURRENT_USER_ID";
    private static final String QUERY_OR_PROCEDURE_PARAM_PREFIX = ":";


    public abstract Object getValue(final Class<?> fieldType);

    public boolean isSystemVariable() {
        return true;
    }
}
