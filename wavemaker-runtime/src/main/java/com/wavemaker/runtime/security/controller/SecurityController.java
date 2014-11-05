package com.wavemaker.runtime.security.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import com.wavemaker.common.StringWrapper;
import com.wavemaker.common.util.WMUtils;
import com.wavemaker.runtime.security.SecurityService;
import com.wavemaker.runtime.security.WMCurrentUser;

/**
 * Created by nileshk on 5/11/14.
 */
@Controller

@RequestMapping(value = "/security")
public class SecurityController {

    @Autowired
    private SecurityService securityService;

    @RequestMapping(value = "/enabled", method = RequestMethod.GET)
    public StringWrapper isSecurityEnabled() {
        return WMUtils.wrapString(String.valueOf(securityService.isSecurityEnabled()));
    }

    @RequestMapping(value = "/user", method = RequestMethod.GET)
    public WMCurrentUser getLoggedInUser() {
        return securityService.getLoggedInUser();
    }

    @RequestMapping(value = "/user/authenticated", method = RequestMethod.GET)
    public boolean isAuthenticated() {
        return securityService.isAuthenticated();
    }

    @RequestMapping(value = "/user/username", method = RequestMethod.GET)
    public String getUsername() {
        return securityService.getUserName();
    }

    @RequestMapping(value = "/user/userid", method = RequestMethod.GET)
    public String getUserId() {
        return securityService.getUserId();
    }

    @RequestMapping(value = "/user/tenantid", method = RequestMethod.GET)
    public int getTenantId(){
        return securityService.getTenantId();
    }

    @RequestMapping(value = "/user/roles", method = RequestMethod.GET)
    public String[] getUserRoles() {
        return securityService.getUserRoles();
    }

    @RequestMapping(value = "/logout", method = RequestMethod.POST)
    public void logout() {
        securityService.logout();
    }
}
