package com.wavemaker.runtime.security.openId;

import java.util.concurrent.TimeUnit;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.wavemaker.commons.auth.oauth2.OAuth2Constants;

/**
 * Created by srujant on 7/8/18.
 */
public class InMemoryOpenIDAuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    private static final Cache<String, OAuth2AuthorizationRequest> cache = CacheBuilder.newBuilder().expireAfterAccess(10, TimeUnit.MINUTES).maximumSize(20).
            build();


    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        String state = getStateParam(request);
        return cache.getIfPresent(state);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest, HttpServletRequest request, HttpServletResponse response) {
        String state = authorizationRequest.getState();
        if (state != null) {
            cache.put(state, authorizationRequest);
        }
    }

    private String getStateParam(HttpServletRequest request) {
        return request.getParameter(OAuth2Constants.STATE);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request) {
        OAuth2AuthorizationRequest authorizationRequest = this.loadAuthorizationRequest(request);
        if (authorizationRequest != null) {
            cache.invalidate(authorizationRequest);
        }
        return authorizationRequest;
    }
}
