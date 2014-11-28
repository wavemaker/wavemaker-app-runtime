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
import com.wordnik.swagger.annotations.Api;
import com.wordnik.swagger.annotations.ApiOperation;

/**
 * Created by nileshk on 5/11/14.
 */
@RestController
@Api(value = "/security", description = "Exposes Apis to work with application security services")
@RequestMapping(value = "/security")
public class SecurityController {

    @Autowired
    private SecurityService securityService;

    @RequestMapping(value = "/enabled", method = RequestMethod.GET)
    @ApiOperation(value = "Returns security status of the application.")
    public StringWrapper isSecurityEnabled() {
        return WMUtils.wrapString(String.valueOf(securityService.isSecurityEnabled()));
    }

    @RequestMapping(value = "/user", method = RequestMethod.GET)
    @ApiOperation(value = "Returns logged-in user details.")
    public WMCurrentUser getLoggedInUser() {
        return securityService.getLoggedInUser();
    }

    @RequestMapping(value = "/user/authenticated", method = RequestMethod.GET)
    @ApiOperation(value = "Returns authentication status of the logged-in user.")
    public BooleanWrapper isAuthenticated() {
        return WMUtils.wrapBoolean(securityService.isAuthenticated());
    }

    @RequestMapping(value = "/user/username", method = RequestMethod.GET)
    @ApiOperation(value = "Returns logged-in user's username")
    public StringWrapper getUsername() {
        return WMUtils.wrapString(securityService.getUserName());
    }

    @RequestMapping(value = "/user/userid", method = RequestMethod.GET)
    @ApiOperation(value = "Returns logged-in user's userid")
    public StringWrapper getUserId() {
        return WMUtils.wrapString(securityService.getUserId());
    }

    @RequestMapping(value = "/user/tenantid", method = RequestMethod.GET)
    @ApiOperation(value = "Returns tenant-id for the logged-in user.")
    public IntegerWrapper getTenantId(){
        return WMUtils.wrapInteger(securityService.getTenantId());
    }

    @RequestMapping(value = "/user/roles", method = RequestMethod.GET)
    @ApiOperation(value = "Returns list of roles for the logged-in user.")
    public List<String> getUserRoles() {
        return Arrays.asList(securityService.getUserRoles());
    }

    @RequestMapping(value = "/logout", method = RequestMethod.POST)
    @ApiOperation(value = "Logout the current user from the application.")
    public void logout() {
        securityService.logout();
    }
}
