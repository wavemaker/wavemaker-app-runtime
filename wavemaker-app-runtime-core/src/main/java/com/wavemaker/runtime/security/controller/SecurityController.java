/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.security.controller;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.commons.util.WMUtils;
import com.wavemaker.commons.wrapper.BooleanWrapper;
import com.wavemaker.commons.wrapper.StringWrapper;
import com.wavemaker.runtime.security.SecurityService;
import com.wavemaker.runtime.security.WMCurrentUser;
import com.wavemaker.runtime.security.model.SecurityInfo;
import com.wavemaker.runtime.security.token.Token;
import com.wordnik.swagger.annotations.Api;
import com.wordnik.swagger.annotations.ApiOperation;

/**
 * Created by nileshk on 5/11/14.
 */
@RestController
@Api(value = "/security", description = "Exposes APIs to work with application security services")
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

    @RequestMapping(value = "/user/roles", method = RequestMethod.GET)
    @ApiOperation(value = "Returns list of roles for the logged-in user.")
    public List<String> getUserRoles() {
        return Arrays.asList(securityService.getUserRoles());
    }

    @RequestMapping(value = "/user/login_time", method = RequestMethod.GET)
    @ApiOperation(value = "Returns login time of logged-in user.")
    public StringWrapper getLoginTime() {
        return WMUtils.wrapString(String.valueOf(securityService.getLoginTime()));
    }

    @RequestMapping(value = "/info", method = RequestMethod.GET)
    @ApiOperation(value = "Returns security information")
    public SecurityInfo getSecurityInfo() {
        return securityService.getSecurityInfo();
    }

    @RequestMapping(value = "/token", method = RequestMethod.GET)
    @ApiOperation(value = "Returns access token for current logged in user")
    public Token getAccessToken() {
        return securityService.generateUserAccessToken();
    }

    @RequestMapping(value = "/ssologin", method = RequestMethod.GET)
    @ApiOperation(value = "redirects to sso login")
    public void ssoLogin() {
        securityService.ssoLogin();
    }
}
