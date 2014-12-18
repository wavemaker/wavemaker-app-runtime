package com.wavemaker.runtime.security;

import javax.servlet.http.HttpServletRequest;

/**
 * @author Uday Shankar
 */
public interface WMCustomAuthenticationManager {

    public WMUser authenticate(HttpServletRequest httpServletRequest);
}
