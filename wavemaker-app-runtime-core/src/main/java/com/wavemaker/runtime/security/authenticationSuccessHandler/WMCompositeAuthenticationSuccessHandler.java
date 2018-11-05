package com.wavemaker.runtime.security.authenticationSuccessHandler;

import java.io.IOException;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import com.wavemaker.commons.WMRuntimeException;

/**
 * Created by srujant on 31/10/18.
 */
public class WMCompositeAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private List<AuthenticationSuccessHandler> authenticationSuccessHandlerList;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws ServletException, IOException {
        for (AuthenticationSuccessHandler authenticationSuccessHandler : authenticationSuccessHandlerList) {
            try {
                authenticationSuccessHandler.onAuthenticationSuccess(request, response, authentication);
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
                if (e instanceof RuntimeException) {
                    throw e;
                }
                throw new WMRuntimeException(e);
            }
        }
    }

    public void setAuthenticationSuccessHandlerList(List<AuthenticationSuccessHandler> authenticationSuccessHandlerList) {
        this.authenticationSuccessHandlerList = authenticationSuccessHandlerList;
    }
}
