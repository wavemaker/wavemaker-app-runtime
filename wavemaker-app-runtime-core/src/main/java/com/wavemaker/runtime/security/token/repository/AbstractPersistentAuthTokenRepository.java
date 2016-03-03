package com.wavemaker.runtime.security.token.repository;

import java.util.concurrent.TimeUnit;

import org.springframework.security.core.userdetails.UserDetails;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;

/**
 * Created by ArjunSahasranam on 7/3/16.
 */
public abstract class AbstractPersistentAuthTokenRepository<I, T extends UserDetails> implements
        PersistentAuthTokenRepository<I, T> {
    public static final TimeUnit SECONDS = TimeUnit.SECONDS;
    public static final int DEFAULT_VALIDITY_SECONDS = 1800;

    private int tokenValiditySeconds = DEFAULT_VALIDITY_SECONDS;

    private Cache<I, T> tokenVsWMUser;

    public AbstractPersistentAuthTokenRepository() {

    }

    public AbstractPersistentAuthTokenRepository(final int tokenValiditySeconds) {
        this.tokenValiditySeconds = tokenValiditySeconds;
    }

    public void addToken(I i, T t) {
        getTokenVsWMUserCache().put(i, t);
    }

    public T getAuthentication(I i) {
        return getTokenVsWMUserCache().getIfPresent(i);
    }

    public void removeAuthentication(I i) {
        getTokenVsWMUserCache().invalidate(i);
    }

    protected Cache<I, T> getTokenVsWMUserCache() {
        if (this.tokenVsWMUser == null) {
            this.tokenVsWMUser = CacheBuilder.newBuilder().expireAfterWrite(tokenValiditySeconds, SECONDS).build();
        }
        return tokenVsWMUser;
    }
}
