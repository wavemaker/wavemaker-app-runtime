package com.wavemaker.runtime.security.authenticationSuccessHandler;


import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.SecurityContextRepository;

/**
 * Created by srujant on 31/10/18.
 */
public class WMSecurityContextRepositorySuccessHandler implements AuthenticationSuccessHandler {

    private SecurityContextRepository securityContextRepository;

    public WMSecurityContextRepositorySuccessHandler(SecurityContextRepository securityContextRepository) {
        this.securityContextRepository = securityContextRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws ServletException, IOException {
        securityContextRepository.saveContext(SecurityContextHolder.getContext(), request, response);
    }

    public void setSecurityContextRepository(SecurityContextRepository securityContextRepository) {
        this.securityContextRepository = securityContextRepository;
    }
}
