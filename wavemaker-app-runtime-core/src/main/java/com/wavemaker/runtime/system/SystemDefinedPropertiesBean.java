package com.wavemaker.runtime.system;


import java.sql.Date;
import java.sql.Time;
import java.util.Calendar;

import org.springframework.beans.factory.annotation.Autowired;

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
