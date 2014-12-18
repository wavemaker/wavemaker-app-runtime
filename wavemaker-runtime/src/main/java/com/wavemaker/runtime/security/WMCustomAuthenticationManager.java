package com.wavemaker.runtime.security;

import javax.servlet.http.HttpServletRequest;

/**
 * The class which needs to be implemented by users who would like to have their custom authentication mechanism
 * @author Uday Shankar
 */
public interface WMCustomAuthenticationManager {

    /**
     * should return WMUser object if the authentication details can be extracted from httpServletRequest through cookie or some other headers.
     * Otherwise the method should return null
     * @param httpServletRequest
     * @return
     */
    public WMUser authenticate(HttpServletRequest httpServletRequest);
}
