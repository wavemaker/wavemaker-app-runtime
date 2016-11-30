package com.wavemaker.runtime.security.provider.saml;

import java.io.IOException;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.saml.SAMLLogoutFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

import com.wavemaker.runtime.util.HttpRequestUtils;
import com.wavemaker.studio.common.json.JSONUtils;
import com.wavemaker.studio.common.wrapper.StringWrapper;

/**
 * Created by ArjunSahasranam on 25/11/16.
 */
public class SAMLDelegatingLogoutFilter extends LogoutFilter {

    @Autowired
    private SAMLLogoutFilter samlLogoutFilter;

    public SAMLDelegatingLogoutFilter(
            final LogoutSuccessHandler logoutSuccessHandler,
            final LogoutHandler... handlers) {
        super(logoutSuccessHandler, handlers);
    }

    @Override
    public void doFilter(
            final ServletRequest req, final ServletResponse res,
            final FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        if (requiresLogout(request, response)) {
            if (HttpRequestUtils.isAjaxRequest(request)) {
                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write(JSONUtils.toJSON(new StringWrapper(request.getRequestURI())));
                response.getWriter().flush();
                return;
            } else {
                samlLogoutFilter.doFilter(request, response, chain);
            }

        }
        chain.doFilter(request, response);
    }
}
