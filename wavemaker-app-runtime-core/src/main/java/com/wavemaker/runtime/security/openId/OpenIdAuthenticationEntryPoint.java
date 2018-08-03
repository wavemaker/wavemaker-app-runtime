package com.wavemaker.runtime.security.openId;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.constraints.NotNull;

import org.springframework.security.core.AuthenticationException;

import com.wavemaker.runtime.security.entrypoint.SSOEntryPoint;
import com.wavemaker.runtime.util.HttpRequestUtils;

import static com.wavemaker.runtime.security.SecurityConstants.SESSION_NOT_FOUND;
import static com.wavemaker.runtime.security.SecurityConstants.X_WM_LOGIN_ERROR_MESSAGE;

/**
 * Created by srujant on 2/8/18.
 */
public class OpenIdAuthenticationEntryPoint implements SSOEntryPoint {

    @NotNull
    private String providerId;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        if (HttpRequestUtils.isAjaxRequest(request)) {
            response.setHeader(X_WM_LOGIN_ERROR_MESSAGE, SESSION_NOT_FOUND);
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
        } else {
            String redirectUrl = createRedirectUrl(request);
            response.sendRedirect(redirectUrl);
        }

    }

    private String createRedirectUrl(HttpServletRequest request) {
        String serviceUrl = HttpRequestUtils.getServiceUrl(request);
        return new StringBuilder(serviceUrl).append("/auth/oauth2/").append(providerId).toString();
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }
}
