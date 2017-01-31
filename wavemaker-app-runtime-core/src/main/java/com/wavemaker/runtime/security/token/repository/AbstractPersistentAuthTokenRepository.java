/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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

import org.springframework.security.core.userdetails.UserDetails;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;

/**
 * Created by ArjunSahasranam on 7/3/16.
 */
public abstract class AbstractPersistentAuthTokenRepository<I, T extends UserDetails> implements
        PersistentAuthTokenRepository<I, T> {
    public static final TimeUnit SECONDS = TimeUnit.SECONDS;

    private int tokenValiditySeconds;

    private Cache<I, T> tokenVsWMUser;

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
