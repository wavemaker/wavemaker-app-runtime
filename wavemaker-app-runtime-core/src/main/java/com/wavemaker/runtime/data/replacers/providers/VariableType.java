package com.wavemaker.runtime.data.replacers.providers;

import java.util.Date;

import org.joda.time.LocalDateTime;

import com.wavemaker.runtime.system.SystemDefinedPropertiesBean;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 23/6/16
 */
public enum VariableType {
    USER_ID {
        @Override
        public Object getValue() {
            return SystemDefinedPropertiesBean.getInstance().getCurrentUserId();
        }
    },
    USER_NAME {
        @Override
        public Object getValue() {
            return SystemDefinedPropertiesBean.getInstance().getCurrentUserName();
        }
    },
    CURRENT_TIMESTAMP {
        @Override
        public Object getValue() {
            return new Date();
        }
    },
    CURRENT_DATE {
        @Override
        public Object getValue() {
            return new Date();
        }
    },
    CURRENT_TIME {
        @Override
        public Object getValue() {
            return new Date();
        }
    },
    CURRENT_DATE_TIME {
        @Override
        public Object getValue() {
            return new LocalDateTime();
        }
    };

    public abstract Object getValue();
}
