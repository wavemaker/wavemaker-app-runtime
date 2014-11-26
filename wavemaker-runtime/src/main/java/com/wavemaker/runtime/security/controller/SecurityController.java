package com.wavemaker.runtime.security.controller;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.common.BooleanWrapper;
import com.wavemaker.common.IntegerWrapper;
import com.wavemaker.common.StringWrapper;
import com.wavemaker.common.util.WMUtils;
import com.wavemaker.runtime.security.SecurityService;
import com.wavemaker.runtime.security.WMCurrentUser;

/**
 * Created by nileshk on 5/11/14.
 */
@RestController
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
    public BooleanWrapper isAuthenticated() {
        return WMUtils.wrapBoolean(securityService.isAuthenticated());
    }

    @RequestMapping(value = "/user/username", method = RequestMethod.GET)
    public StringWrapper getUsername() {
        return WMUtils.wrapString(securityService.getUserName());
    }

    @RequestMapping(value = "/user/userid", method = RequestMethod.GET)
    public StringWrapper getUserId() {
        return WMUtils.wrapString(securityService.getUserId());
    }

    @RequestMapping(value = "/user/tenantid", method = RequestMethod.GET)
    public IntegerWrapper getTenantId(){
        return WMUtils.wrapInteger(securityService.getTenantId());
    }

    @RequestMapping(value = "/user/roles", method = RequestMethod.GET)
    public List<String> getUserRoles() {
        return Arrays.asList(securityService.getUserRoles());
    }

    @RequestMapping(value = "/logout", method = RequestMethod.POST)
    public void logout() {
        securityService.logout();
    }
}
