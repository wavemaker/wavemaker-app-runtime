package com.wavemaker.runtime.security.handler;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.saml.SAMLCredential;

import com.wavemaker.runtime.security.Attribute;
import com.wavemaker.runtime.security.WMAuthentication;
import com.wavemaker.runtime.security.provider.saml.SAMLConstants;

/**
 * Created by srujant on 21/11/18.
 */
public class WMSamlAuthenticationSuccessHandler implements WMAuthenticationSuccessHandler {
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, WMAuthentication authentication) throws IOException, ServletException {
        Authentication samlAuthenticationToken = authentication.getAuthenticationSource();
        SAMLCredential samlCredential = (SAMLCredential) samlAuthenticationToken.getCredentials();
        authentication.addAttribute(SAMLConstants.SAML_CREDENTIALS, samlCredential, Attribute.AttributeScope.SERVER_ONLY);
    }
}
