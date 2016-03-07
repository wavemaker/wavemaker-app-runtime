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
package com.wavemaker.runtime.security.token;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Collection;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.RememberMeAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.codec.Base64;
import org.springframework.security.crypto.codec.Hex;
import org.springframework.util.StringUtils;

import com.wavemaker.runtime.security.WMUser;
import com.wavemaker.runtime.security.token.repository.InMemoryPersistentAuthTokenRepository;
import com.wavemaker.runtime.security.token.repository.PersistentAuthTokenRepository;

/**
 * Generate Token encoded by this implementation adopts the following form:
 * <pre>
 * username + &quot;:&quot; + expiryTime + &quot;:&quot; + Md5Hex(username + &quot;:&quot; + expiryTime + &quot;:&quot; + password + &quot;:&quot; + key)
 * </pre>
 * <p/>
 * Persist generated token with authentication in repository.And if any request comes with auth token which is
 * there in repository,then authentication retrieved from repository instead of hitting to its providers again.
 * <p/>
 * InMemoryPersistentAuthTokenRepository which is used to persist token and authentication in memory.
 * It is recommended to persist token in repository.
 *
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 7/2/16
 */
public class WMTokenBasedAuthenticationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(WMTokenBasedAuthenticationService.class);

    public static final String DELIMITER = ":";
    public static final int DEFAULT_VALIDITY_SECONDS = 1800;
    public static final String DEFAULT_KEY = "WM_TOKEN";

    private int tokenValiditySeconds = DEFAULT_VALIDITY_SECONDS;
    private String key = DEFAULT_KEY;
    private PersistentAuthTokenRepository<String, WMUser> persistentAuthTokenRepository = new InMemoryPersistentAuthTokenRepository(tokenValiditySeconds);

    public WMTokenBasedAuthenticationService() {
    }

    public WMTokenBasedAuthenticationService(int tokenValiditySeconds) {
        this.tokenValiditySeconds = tokenValiditySeconds;
    }

    public Token generateToken(Authentication successfulAuthentication) {
        String username = retrieveUserName(successfulAuthentication);

        if (!StringUtils.hasLength(username)) {
            LOGGER.debug("Unable to retrieve username");
            return null;
        }

        int tokenLifetime = calculateLoginLifetime();
        long expiryTime = System.currentTimeMillis();
        expiryTime += 1000L * (tokenLifetime < 0 ? tokenValiditySeconds : tokenLifetime);

        String signatureValue = makeTokenSignature(expiryTime, username);

        Token token = new Token(encodeToken(new String[]{username, Long.toString(expiryTime), signatureValue}));

        WMUser wmUser = toWMUser(successfulAuthentication);
        persistentAuthTokenRepository.addToken(token.getWmAuthToken(), wmUser);

        return token;

    }

    public Authentication getAuthentication(Token token) {
        WMUser wmUser = persistentAuthTokenRepository.getAuthentication(token.getWmAuthToken());
        return toAuthentication(wmUser);
    }

    public void setTokenValiditySeconds(final int tokenValiditySeconds) {
        this.tokenValiditySeconds = tokenValiditySeconds;
    }

    public void setKey(String key) {
        this.key = key;
    }

    protected WMUser toWMUser(final Authentication authentication) {
        if (authentication instanceof UsernamePasswordAuthenticationToken) {
            UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = (UsernamePasswordAuthenticationToken) authentication;
            if (usernamePasswordAuthenticationToken.getPrincipal() instanceof WMUser) {
                return (WMUser) usernamePasswordAuthenticationToken.getPrincipal();
            }
            String username = (String) usernamePasswordAuthenticationToken.getPrincipal();
            String password = (String) usernamePasswordAuthenticationToken.getCredentials();
            return toWMUser(username, password, authentication.getAuthorities());

        } else if (authentication instanceof RememberMeAuthenticationToken) {
            RememberMeAuthenticationToken rememberMeAuthenticationToken = (RememberMeAuthenticationToken) authentication;
            String username = (String) rememberMeAuthenticationToken.getPrincipal();
            String password = (String) rememberMeAuthenticationToken.getCredentials();
            return toWMUser(username, password, authentication.getAuthorities());
        }
        return null;
    }

    private WMUser toWMUser(final String username, final String password, Collection<? extends GrantedAuthority> authorities) {
        return new WMUser(username, username, password, username, 0, true, true, true, true, authorities, System.currentTimeMillis());
    }

    protected Authentication toAuthentication(final WMUser wmUser) {
        return new UsernamePasswordAuthenticationToken(wmUser.getUsername(), null, wmUser.getAuthorities());
    }

    protected String retrieveUserName(Authentication authentication) {
        if (isInstanceOfUserDetails(authentication)) {
            return ((UserDetails) authentication.getPrincipal()).getUsername();
        } else {
            return authentication.getPrincipal().toString();
        }
    }

    protected int calculateLoginLifetime() {
        return tokenValiditySeconds;
    }

    /**
     * Calculates the digital signature to be put in the cookie. Default value is
     * MD5 ("username:tokenExpiryTime:password:key")
     */
    protected String makeTokenSignature(long tokenExpiryTime, String username) {
        String data = username + ":" + tokenExpiryTime + ":" + UUID.randomUUID() + ":" + key;
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("MD5");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("No MD5 algorithm available!");
        }

        return new String(Hex.encode(digest.digest(data.getBytes())));
    }

    private boolean isInstanceOfUserDetails(Authentication authentication) {
        return authentication.getPrincipal() instanceof UserDetails;
    }

    protected String encodeToken(String[] cookieTokens) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cookieTokens.length; i++) {
            sb.append(cookieTokens[i]);

            if (i < cookieTokens.length - 1) {
                sb.append(DELIMITER);
            }
        }

        String value = sb.toString();

        sb = new StringBuilder(new String(Base64.encode(value.getBytes())));

        while (sb.charAt(sb.length() - 1) == '=') {
            sb.deleteCharAt(sb.length() - 1);
        }

        return sb.toString();
    }


}
