package com.wavemaker.runtime.auth.oauth2;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.runtime.auth.oauth2.service.OAuth2RuntimeServiceManager;

/**
 * Created by srujant on 18/7/17.
 */
@RestController
@RequestMapping(value = "/oauth2/{providerId}/")
public class OAuth2RuntimeIntegrationController {

    @Autowired
    private OAuth2RuntimeServiceManager oAuth2RuntimeServiceManager;


    @RequestMapping(value = "authorizationUrl", method = RequestMethod.GET)
    public String getAuthorizationUrl(@PathVariable("providerId") String providerId, @RequestParam(name = "key", required = false) String key, @RequestParam
            (name = "requestSourceType", required = false) String requestSourceType, HttpServletRequest httpServletRequest) {
        return oAuth2RuntimeServiceManager.getAuthorizationUrl(providerId, requestSourceType, key, httpServletRequest);
    }

    @RequestMapping(value = "callback", method = RequestMethod.GET, produces = "text/html")
    public String callBack(@PathVariable("providerId") String providerId, @RequestParam(name = "redirect_url", required = false) String redirectUrl,
                           @RequestParam(name = "code") String code, @RequestParam(name = "state", required = false) String state, HttpServletRequest
                                   httpServletRequest) {
        return oAuth2RuntimeServiceManager.callBack(providerId, redirectUrl, code, state, httpServletRequest);
    }

}
