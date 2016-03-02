package com.wavemaker.runtime.security.token.repository;

import org.springframework.security.core.userdetails.User;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 10/2/16
 */
public interface PersistentAuthTokenRepository<String,T extends User> {

    public void addToken(String token,T t);

    public T getAuthentication(String token);

    public void removeAuthentication(String token);
}
