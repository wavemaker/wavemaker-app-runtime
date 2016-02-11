package com.wavemaker.runtime.security.token.repository;

import org.springframework.security.core.Authentication;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 10/2/16
 */
public interface PersistentAuthTokenRepository {

    public void addToken(String token,Authentication authentication);

    public Authentication getAuthentication(String token);

    public void removeAuthentication(String token);
}
