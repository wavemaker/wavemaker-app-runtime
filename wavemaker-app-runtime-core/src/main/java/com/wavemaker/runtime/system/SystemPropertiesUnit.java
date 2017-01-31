/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
