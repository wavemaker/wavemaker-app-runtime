package com.wavemaker.runtime.security.token.repository;

import java.util.concurrent.TimeUnit;

import org.springframework.security.core.Authentication;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 10/2/16
 */
public class InMemoryPersistentAuthTokenRepository implements PersistentAuthTokenRepository {

    public static final TimeUnit SECONDS = TimeUnit.SECONDS;
    public static final int DEFAULT_VALIDITY_SECONDS = 1800;

    private int tokenValiditySeconds = DEFAULT_VALIDITY_SECONDS;

    private Cache<String, Authentication> tokenVsAuthentication;

    public InMemoryPersistentAuthTokenRepository() {
    }

    public InMemoryPersistentAuthTokenRepository(final int tokenValiditySeconds) {
        this.tokenValiditySeconds = tokenValiditySeconds;
    }

    @Override
    public void addToken(final String token, final Authentication authentication) {
       getTokenVsAuthCache().put(token,authentication);
    }

    @Override
    public Authentication getAuthentication(final String token) {
        return getTokenVsAuthCache().getIfPresent(token);
    }

    @Override
    public void removeAuthentication(final String token) {
        getTokenVsAuthCache().invalidate(token);
    }

    protected Cache<String, Authentication> getTokenVsAuthCache() {
        if (this.tokenVsAuthentication == null) {
            this.tokenVsAuthentication = CacheBuilder.newBuilder().expireAfterWrite(tokenValiditySeconds, SECONDS).build();
        }
        return tokenVsAuthentication;
    }
}
