/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
