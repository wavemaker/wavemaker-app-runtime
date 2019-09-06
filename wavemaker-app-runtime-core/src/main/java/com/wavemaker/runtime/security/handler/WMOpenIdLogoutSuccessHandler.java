package com.wavemaker.runtime.security.handler;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.authentication.logout.SimpleUrlLogoutSuccessHandler;
import org.springframework.util.CollectionUtils;

import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.wrapper.StringWrapper;
import com.wavemaker.runtime.security.WMAuthentication;
import com.wavemaker.runtime.security.openId.OpenIdProviderRuntimeConfig;

public class WMOpenIdLogoutSuccessHandler extends SimpleUrlLogoutSuccessHandler {

    private Logger logger = LoggerFactory.getLogger(WMOpenIdLogoutSuccessHandler.class);

    @Autowired
    private OpenIdProviderRuntimeConfig openIdProviderRuntimeConfig;

    private RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();
    private static final String QUESTION_MARK = "?";
    private static final String QUERY_PARAM_DELIMITER = "&";
    private static final String EQUALS = "=";
    private static final String QUERY_PARAM_ID_TOKEN_HINT = "id_token_hint";
    private static final String QUERY_PARAM_POST_LOGOUT_REDIRECT_URI = "post_logout_redirect_uri";
    private static final String URL_DELIMITER = "://";
    private static final String COLON = ":";
    private static final String SCHEME_HTTP = "http";
    private static final String SCHEME_HTTPS = "https";
    private static final int DEFAULT_HTTP_PORT = 80;
    private static final int DEFAULT_HTTPS_PORT = 443;

    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response,
                                Authentication authentication) throws IOException {
        String targetUrl = determineTargetUrl(request, response, authentication);
        if (targetUrl != null) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(JSONUtils.toJSON(new StringWrapper(targetUrl)));
            response.getWriter().flush();
            return;
        }
        redirectStrategy.sendRedirect(request, response, super.determineTargetUrl(request, response));
    }

    /**
     * TODO Always taking the first openId providerInfo, find a better-way to get a particular ProviderInfo from the list
     **/
    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        String logoutUrl = null;
        if (openIdProviderRuntimeConfig != null && !CollectionUtils.isEmpty(openIdProviderRuntimeConfig.getOpenIdProviderInfoList())) {
            logoutUrl = openIdProviderRuntimeConfig.getOpenIdProviderInfoList().get(0).getLogoutUrl();
        }
        if (StringUtils.isNotBlank(logoutUrl)) {
            StringBuilder targetUrl = new StringBuilder()
                    .append(logoutUrl).append(QUESTION_MARK)
                    .append(idTokenHintQueryParam(((OidcUser) ((WMAuthentication) authentication).getAuthenticationSource().getPrincipal())))
                    .append(QUERY_PARAM_DELIMITER).append(postLogoutUrlQueryParam(request));
            logger.info("Using the {} logoutUrl", targetUrl);
            return targetUrl.toString();
        }
        return null;
    }

    private String idTokenHintQueryParam(OidcUser oidcUser) {
        return QUERY_PARAM_ID_TOKEN_HINT + EQUALS + oidcUser.getIdToken().getTokenValue();
    }

    private String postLogoutUrlQueryParam(HttpServletRequest request) {
        String postLogoutUrl = buildPlatformLogoutUrl(request);
        logger.info("Post logout url : {}", postLogoutUrl);
        return QUERY_PARAM_POST_LOGOUT_REDIRECT_URI + EQUALS + postLogoutUrl;
    }

    private String buildPlatformLogoutUrl(HttpServletRequest request) {
        StringBuilder postLogoutUrl = new StringBuilder();
        postLogoutUrl.append(request.getScheme()).append(URL_DELIMITER).append(request.getServerName());
        if (!((request.getScheme().equals(SCHEME_HTTP) && request.getServerPort() == DEFAULT_HTTP_PORT)
                || (request.getScheme().equals(SCHEME_HTTPS) && request.getServerPort() == DEFAULT_HTTPS_PORT))) {
            postLogoutUrl.append(COLON).append(request.getServerPort());
        }
        postLogoutUrl.append(request.getContextPath());
        return postLogoutUrl.toString();
    }
}
