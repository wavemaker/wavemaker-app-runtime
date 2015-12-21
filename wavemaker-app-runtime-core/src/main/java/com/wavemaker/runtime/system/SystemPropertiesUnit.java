package com.wavemaker.runtime.system;

import java.sql.Time;
import java.util.Date;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 17/12/15
 */
public enum SystemPropertiesUnit implements SystemUnit {

    _SYSTEM_CURRENT_DATE {
        @Override
        public Date getValue() {
            return SystemDefinedPropertiesBean.getInstance().getCurrentDate();
        }
    },
    _SYSTEM_CURRENT_TIME {
        @Override
        public Time getValue() {
            return SystemDefinedPropertiesBean.getInstance().getCurrentTime();
        }
    },
    _SYSTEM_CURRENT_USER_NAME {
        @Override
        public String getValue() {
            return SystemDefinedPropertiesBean.getInstance().getCurrentUserName();
        }
    },
    _SYSTEM_CURRENT_USER_ID {
        @Override
        public String getValue() {
            return SystemDefinedPropertiesBean.getInstance().getCurrentUserId();
        }
    };
}
