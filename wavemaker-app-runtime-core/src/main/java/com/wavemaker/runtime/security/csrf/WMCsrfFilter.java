package com.wavemaker.runtime.security.csrf;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.security.authentication.AuthenticationTrustResolver;
import org.springframework.security.authentication.AuthenticationTrustResolverImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.InvalidCsrfTokenException;
import org.springframework.security.web.csrf.MissingCsrfTokenException;
import org.springframework.security.web.util.UrlUtils;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Created by srujant on 31/10/18.
 */
public class WMCsrfFilter extends OncePerRequestFilter {

    public static final RequestMatcher DEFAULT_CSRF_MATCHER = new DefaultRequiresCsrfMatcher();
    private final Log logger = LogFactory.getLog(getClass());
    private CsrfTokenRepository tokenRepository;
    private RequestMatcher requireCsrfProtectionMatcher = DEFAULT_CSRF_MATCHER;
    private AccessDeniedHandler accessDeniedHandler = new AccessDeniedHandlerImpl();
    private AuthenticationTrustResolver trustResolver = new AuthenticationTrustResolverImpl();

    public WMCsrfFilter(CsrfTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    public WMCsrfFilter(CsrfTokenRepository tokenRepository, RequestMatcher requestMatcher) {
        this.tokenRepository = tokenRepository;
        this.requireCsrfProtectionMatcher = requestMatcher;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || trustResolver.isAnonymous(authentication) || !this.requireCsrfProtectionMatcher.matches(request)) {
            filterChain.doFilter(request, response);
            return;
        }
        CsrfToken csrfToken = this.tokenRepository.loadToken(request);
        final boolean missingToken = csrfToken == null;
        String actualToken = null;
        if (!missingToken) {
            actualToken = request.getHeader(csrfToken.getHeaderName());
            if (actualToken == null) {
                actualToken = request.getParameter(csrfToken.getParameterName());
            }
        }
        if (missingToken || !csrfToken.getToken().equals(actualToken)) {
            if (this.logger.isDebugEnabled()) {
                this.logger.debug("Invalid CSRF token found for "
                        + UrlUtils.buildFullRequestUrl(request));
            }
            if (missingToken) {
                this.accessDeniedHandler.handle(request, response,
                        new MissingCsrfTokenException(actualToken));
            } else {
                this.accessDeniedHandler.handle(request, response,
                        new InvalidCsrfTokenException(csrfToken, actualToken));
            }
            return;
        }
        filterChain.doFilter(request, response);
    }

    private static final class DefaultRequiresCsrfMatcher implements RequestMatcher {
        private final HashSet<String> allowedMethods = new HashSet<>(
                Arrays.asList("GET", "HEAD", "TRACE", "OPTIONS"));

        @Override
        public boolean matches(HttpServletRequest request) {
            return !this.allowedMethods.contains(request.getMethod());
        }
    }


}
