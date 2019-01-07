package com.wavemaker.runtime.security.token.repository;

import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.wavemaker.commons.model.security.TokenAuthConfig;
import com.wavemaker.runtime.security.WMUser;

/**
 * Created by prakashb on 2/1/19.
 */
public class WMTokenRepository implements TokenRepository {

    @Autowired
    private TokenAuthConfig tokenAuthConfig;

    public static final int DEFAULT_VALIDITY_SECONDS = 1800;

    private static final TimeUnit SECONDS = TimeUnit.SECONDS;

    private int tokenValiditySeconds = DEFAULT_VALIDITY_SECONDS;

    private Cache<String, WMUser> tokenVsWMUser;

    @PostConstruct
    public void init() {
        tokenValiditySeconds = tokenAuthConfig.getTokenValiditySeconds();
        tokenVsWMUser = CacheBuilder.newBuilder().expireAfterWrite(tokenValiditySeconds, SECONDS).build();
    }

    @Override
    public void addToken(String token, WMUser wmUser) {
        tokenVsWMUser.put(token, wmUser);
    }

    @Override
    public WMUser loadUser(String token) {
        return tokenVsWMUser.getIfPresent(token);
    }

    @Override
    public void removeUser(String token) {
        tokenVsWMUser.invalidate(token);
    }
}
