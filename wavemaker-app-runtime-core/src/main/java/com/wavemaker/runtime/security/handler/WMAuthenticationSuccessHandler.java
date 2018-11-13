package com.wavemaker.runtime.security.handler;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.wavemaker.runtime.security.WMAuthentication;

/**
 * Created by srujant on 13/11/18.
 */
public interface WMAuthenticationSuccessHandler {

    void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, WMAuthentication authentication) throws IOException, ServletException;
}
