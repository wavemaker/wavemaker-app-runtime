package com.wavemaker.runtime.security.token.repository;

import java.util.concurrent.TimeUnit;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.wavemaker.runtime.security.WMUser;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 10/2/16
 */
public class InMemoryPersistentAuthTokenRepository implements PersistentAuthTokenRepository<String,WMUser> {

    public static final TimeUnit SECONDS = TimeUnit.SECONDS;
    public static final int DEFAULT_VALIDITY_SECONDS = 1800;

    private int tokenValiditySeconds = DEFAULT_VALIDITY_SECONDS;

    private Cache<String, WMUser> tokenVsWMUser;

    public InMemoryPersistentAuthTokenRepository() {
    }

    public InMemoryPersistentAuthTokenRepository(final int tokenValiditySeconds) {
        this.tokenValiditySeconds = tokenValiditySeconds;
    }

    @Override
    public void addToken(final String token, final WMUser wmUser) {
       getTokenVsWMUserCache().put(token, wmUser);
    }

    @Override
    public WMUser getAuthentication(final String token) {
        return getTokenVsWMUserCache().getIfPresent(token);
    }

    @Override
    public void removeAuthentication(final String token) {
        getTokenVsWMUserCache().invalidate(token);
    }

    protected Cache<String, WMUser> getTokenVsWMUserCache() {
        if (this.tokenVsWMUser == null) {
            this.tokenVsWMUser = CacheBuilder.newBuilder().expireAfterWrite(tokenValiditySeconds, SECONDS).build();
        }
        return tokenVsWMUser;
    }
}
