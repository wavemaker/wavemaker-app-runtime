package com.wavemaker.runtime.security.handler;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.saml.SAMLRelayStateSuccessHandler;

import com.wavemaker.runtime.security.WMAuthentication;

/**
 * Created by srujant on 23/11/18.
 */
public class WMSamlAuthenticationSuccessRedirectionHandler extends SAMLRelayStateSuccessHandler implements WMAuthenticationRedirectionHandler {
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, WMAuthentication authentication) throws IOException, ServletException {
        super.onAuthenticationSuccess(request, response, authentication.getAuthenticationSource());
    }
}
