package com.wavemaker.runtime.security.handler;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Optional;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;

import com.wavemaker.commons.CommonConstants;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.model.security.CSRFConfig;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.model.LoginSuccessResponse;
import com.wavemaker.runtime.util.HttpRequestUtils;

import static com.wavemaker.runtime.security.SecurityConstants.CACHE_CONTROL;
import static com.wavemaker.runtime.security.SecurityConstants.EXPIRES;
import static com.wavemaker.runtime.security.SecurityConstants.NO_CACHE;
import static com.wavemaker.runtime.security.SecurityConstants.PRAGMA;
import static com.wavemaker.runtime.security.SecurityConstants.TEXT_PLAIN_CHARSET_UTF_8;

/**
 * Created by srujant on 19/11/18.
 */
public class WMCsrfTokenResponseWriterAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private CsrfTokenRepository csrfTokenRepository;

    public WMCsrfTokenResponseWriterAuthenticationSuccessHandler(CsrfTokenRepository csrfTokenRepository) {
        this.csrfTokenRepository = csrfTokenRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        Optional<CsrfToken> csrfTokenOptional = getCsrfToken(request);
        if (HttpRequestUtils.isAjaxRequest(request)) {
            request.setCharacterEncoding(CommonConstants.UTF8);
            response.setContentType(TEXT_PLAIN_CHARSET_UTF_8);
            response.setHeader(CACHE_CONTROL, NO_CACHE);
            response.setDateHeader(EXPIRES, 0);
            response.setHeader(PRAGMA, NO_CACHE);
            response.setStatus(HttpServletResponse.SC_OK);
            writeCsrfTokenToResponse(csrfTokenOptional, response);
            response.getWriter().flush();
        }
    }

    private void writeCsrfTokenToResponse(Optional<CsrfToken> csrfTokenOptional, HttpServletResponse response) throws IOException {
        if (csrfTokenOptional.isPresent()) {
            CsrfToken csrfToken = csrfTokenOptional.get();
            PrintWriter writer = response.getWriter();
            LoginSuccessResponse loginSuccessResponse = new LoginSuccessResponse();
            loginSuccessResponse.setWmCsrfToken(csrfToken.getToken());
            writer.println(JSONUtils.toJSON(loginSuccessResponse));
            writer.flush();
        }
    }

    public void setCsrfTokenRepository(CsrfTokenRepository csrfTokenRepository) {
        this.csrfTokenRepository = csrfTokenRepository;
    }


    private Optional<CsrfToken> getCsrfToken(HttpServletRequest request) {
        CSRFConfig csrfConfig = WMAppContext.getInstance().getSpringBean(CSRFConfig.class);
        if (csrfConfig != null && csrfConfig.isEnforceCsrfSecurity()) {
            CsrfToken csrfToken = csrfTokenRepository.loadToken(request);
            return Optional.ofNullable(csrfToken);
        }
        return Optional.empty();
    }
}
