package com.wavemaker.runtime.security.handler;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.oauth2.client.authentication.OAuth2LoginAuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import com.wavemaker.runtime.security.Attribute;
import com.wavemaker.runtime.security.WMAuthentication;

/**
 * Created by srujant on 13/11/18.
 */
public class WMOpenIdAuthenticationSuccessHandler implements WMAuthenticationSuccessHandler {
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, WMAuthentication authentication) throws IOException, ServletException {
        OAuth2LoginAuthenticationToken oAuth2LoginAuthenticationToken = (OAuth2LoginAuthenticationToken) authentication.getAuthenticationSource();
        OidcUser oidcUser = (OidcUser) oAuth2LoginAuthenticationToken.getPrincipal();
        oidcUser.getClaims().entrySet().stream().forEach(entry -> {
            authentication.addAttribute(entry.getKey(), entry.getValue(), Attribute.AttributeScope.ALL);
        });
    }
}
