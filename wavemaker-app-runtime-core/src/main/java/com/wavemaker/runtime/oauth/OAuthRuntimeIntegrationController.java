package com.wavemaker.runtime.oauth;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.runtime.oauth.service.OAuthRuntimeServiceManager;

/**
 * Created by srujant on 18/7/17.
 */
@RestController
@RequestMapping(value = "/oauth/{providerId}/")
public class OAuthRuntimeIntegrationController {

    @Autowired
    private OAuthRuntimeServiceManager oAuthRuntimeServiceManager;


    @RequestMapping(value = "authorizationUrl", method = RequestMethod.GET)
    public String getAuthorizationUrl(@PathVariable("providerId") String providerId, @RequestParam(value = "scope") String scope, HttpServletRequest
            httpServletRequest) {
        return oAuthRuntimeServiceManager.getAuthorizationUrl(providerId, scope, httpServletRequest);
    }

    @RequestMapping(value = "callback", method = RequestMethod.GET, produces = "text/html")
    public String callBack(@PathVariable("providerId") String providerId, @RequestParam(name = "redirect_url") String redirectUrl, @RequestParam(name = "code")
            String code, HttpServletRequest httpServletRequest) {
        return oAuthRuntimeServiceManager.callBack(providerId, redirectUrl, code, httpServletRequest);
    }

}
