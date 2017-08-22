package com.wavemaker.runtime.oauth2;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.runtime.oauth2.service.OAuth2RuntimeServiceManager;

/**
 * Created by srujant on 18/7/17.
 */
@RestController
@RequestMapping(value = "/oauth2/{providerId}/")
public class OAuth2RuntimeIntegrationController {

    @Autowired
    private OAuth2RuntimeServiceManager oAuth2RuntimeServiceManager;


    @RequestMapping(value = "authorizationUrl", method = RequestMethod.GET)
    public String getAuthorizationUrl(@PathVariable("providerId") String providerId, HttpServletRequest httpServletRequest) {
        return oAuth2RuntimeServiceManager.getAuthorizationUrl(providerId, httpServletRequest);
    }

    @RequestMapping(value = "callback", method = RequestMethod.GET, produces = "text/html")
    public String callBack(@PathVariable("providerId") String providerId, @RequestParam(name = "redirect_url") String redirectUrl, @RequestParam(name = "code")
            String code, HttpServletRequest httpServletRequest) {
        return oAuth2RuntimeServiceManager.callBack(providerId, redirectUrl, code, httpServletRequest);
    }

}
