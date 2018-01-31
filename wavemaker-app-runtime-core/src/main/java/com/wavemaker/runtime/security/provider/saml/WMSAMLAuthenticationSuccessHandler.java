package com.wavemaker.runtime.security.provider.saml;

import java.io.IOException;
import java.util.Optional;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.saml.SAMLRelayStateSuccessHandler;
import org.springframework.security.web.csrf.CsrfToken;

import com.wavemaker.runtime.util.HttpRequestUtils;

/**
 * @author Kishore Routhu on 1/2/18 11:22 AM.
 */
public class WMSAMLAuthenticationSuccessHandler extends SAMLRelayStateSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws ServletException, IOException {
        Optional<CsrfToken> csrfTokenOptional = HttpRequestUtils.getCsrfToken(request);
        HttpRequestUtils.addCsrfCookie(csrfTokenOptional, request, response);
        super.onAuthenticationSuccess(request, response, authentication);
    }
}
