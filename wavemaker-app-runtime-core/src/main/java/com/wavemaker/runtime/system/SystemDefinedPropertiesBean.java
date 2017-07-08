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


import java.sql.Date;
import java.sql.Time;
import java.util.Calendar;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.SecurityService;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 17/12/15
 */
public class SystemDefinedPropertiesBean {

    private final static SystemDefinedPropertiesBean instance = new SystemDefinedPropertiesBean();

    private SystemDefinedPropertiesBean() {
    }

    public static final SystemDefinedPropertiesBean getInstance() {
        return instance;
    }

    public Date getCurrentDate() {
        return new Date(Calendar.getInstance().getTime().getTime());
    }

    public Time getCurrentTime() {
        return new Time(Calendar.getInstance().getTime().getTime());
    }

    public String getCurrentUserName() {
        final SecurityService securityService =  getSecurityService();
        if (securityService != null && securityService.isSecurityEnabled()) {
            return securityService.getLoggedInUser().getUserName();
        }
        return null;
    }

    public String getCurrentUserId() {
        final SecurityService securityService =  getSecurityService();
        if (securityService != null && securityService.isSecurityEnabled()) {
            return securityService.getLoggedInUser().getUserId();
        }
        return null;
    }

    private SecurityService getSecurityService() {
        return WMAppContext.getInstance().getSpringBean("securityService");
    }

}
