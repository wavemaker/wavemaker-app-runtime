/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.security.token;

import java.util.Collection;
import java.util.Objects;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.RememberMeAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.cas.authentication.CasAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;

import com.wavemaker.commons.model.security.TokenAuthConfig;
import com.wavemaker.runtime.security.WMAuthentication;
import com.wavemaker.runtime.security.WMUser;
import com.wavemaker.runtime.security.token.exception.TokenGenerationException;
import com.wavemaker.runtime.security.token.repository.WMTokenRepository;
import com.wavemaker.runtime.util.MessageDigestUtil;

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

    @Autowired
    private TokenAuthConfig tokenAuthConfig;

    @Autowired
    private WMTokenRepository tokenRepository;

    private static final Logger LOGGER = LoggerFactory.getLogger(WMTokenBasedAuthenticationService.class);

    public static final int DEFAULT_VALIDITY_SECONDS = WMTokenRepository.DEFAULT_VALIDITY_SECONDS;
    public static final String DEFAULT_KEY = "WM_TOKEN";

    private int tokenValiditySeconds = DEFAULT_VALIDITY_SECONDS;
    private String key = DEFAULT_KEY;


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
        expiryTime += 1000L * (tokenLifetime < 0 ? DEFAULT_VALIDITY_SECONDS : tokenLifetime);

        String signatureValue = makeTokenSignature(expiryTime, username);

        Token token = new Token(signatureValue);

        WMUser wmUser = toWMUser(successfulAuthentication);
        tokenRepository.addToken(token.getWmAuthToken(), wmUser);

        return token;

    }

    public Authentication getAuthentication(Token token) {
        WMUser wmUser = tokenRepository.loadUser(token.getWmAuthToken());
        return toAuthentication(wmUser);
    }

    public void setTokenValiditySeconds(final int tokenValiditySeconds) {
        this.tokenValiditySeconds = tokenValiditySeconds;
    }

    public String getParameter() {
        return tokenAuthConfig.getParameter();
    }

    public void setKey(String key) {
        this.key = key;
    }

    public boolean isEnabled() {
        return tokenAuthConfig.isEnabled();
    }

    protected WMUser toWMUser(final Authentication authentication) {
        Authentication authenticationSource = ((WMAuthentication) authentication).getAuthenticationSource();
        if (authenticationSource instanceof UsernamePasswordAuthenticationToken) {
            UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = (UsernamePasswordAuthenticationToken) authenticationSource;
            if (usernamePasswordAuthenticationToken.getPrincipal() instanceof WMUser) {
                return (WMUser) usernamePasswordAuthenticationToken.getPrincipal();
            } else if (usernamePasswordAuthenticationToken.getPrincipal() instanceof UserDetails) {
                UserDetails userDetails = (UserDetails) usernamePasswordAuthenticationToken.getPrincipal();
                String password = userDetails.getPassword() == null ? "" : userDetails.getPassword();
                return toWMUser(userDetails.getUsername(), password, userDetails.getAuthorities());
            } else {
                String username = (String) usernamePasswordAuthenticationToken.getPrincipal();
                return toWMUser(username, "", authenticationSource.getAuthorities());
            }

        } else if (Objects.equals(authenticationSource.getClass().getName(),"org.springframework.security.cas.authentication.CasAuthenticationToken")) {
            //TODO find a better way
            CasAuthenticationToken casAuthenticationToken = (CasAuthenticationToken) authenticationSource;
            if (casAuthenticationToken.getPrincipal() instanceof WMUser) {
                return (WMUser) casAuthenticationToken.getPrincipal();
            }
        } else if (authenticationSource instanceof RememberMeAuthenticationToken) {
            RememberMeAuthenticationToken rememberMeAuthenticationToken = (RememberMeAuthenticationToken) authenticationSource;
            String username = (String) rememberMeAuthenticationToken.getPrincipal();
            String password = (String) rememberMeAuthenticationToken.getCredentials();
            return toWMUser(username, password, authenticationSource.getAuthorities());
        }
        throw new TokenGenerationException("Unknown authentication,failed to build token for current user");
    }

    private WMUser toWMUser(final String username, final String password, Collection<? extends GrantedAuthority> authorities) {
        return new WMUser(username, username, password, username, 0, true, true, true, true, authorities, System.currentTimeMillis());
    }

    protected Authentication toAuthentication(final WMUser wmUser) {
        if (wmUser != null) {
            return new UsernamePasswordAuthenticationToken(wmUser, null, wmUser.getAuthorities());
        }
        return null;
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
        return MessageDigestUtil.getDigestedData(data);
    }

    private boolean isInstanceOfUserDetails(Authentication authentication) {
        return authentication.getPrincipal() instanceof UserDetails;
    }


}
