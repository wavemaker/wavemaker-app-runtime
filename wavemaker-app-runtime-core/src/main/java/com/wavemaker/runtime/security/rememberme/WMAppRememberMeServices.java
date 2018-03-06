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
package com.wavemaker.runtime.security.rememberme;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Date;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.codec.Hex;
import org.springframework.security.web.authentication.rememberme.InvalidCookieException;
import org.springframework.util.StringUtils;

import com.wavemaker.runtime.security.WMUser;
import com.wavemaker.runtime.security.config.WMAppSecurityConfig;
import com.wavemaker.runtime.security.token.repository.PersistentAuthTokenRepository;

/**
 * @author Arjun Sahasranam
 * @author Sunil Pulugula
 */
public class WMAppRememberMeServices extends AbstractWMRememberMeServices {

    public static final String REMEMBER_ME_PARAMETER = "remember-me";

    @Autowired
    private WMAppSecurityConfig securityConfig;

    private final PersistentAuthTokenRepository<UniqueUserId, WMUser> userDetailsCache = new WMRememberMeMemoryPersistentAuthTokenRepository(
            getTokenValiditySeconds());


    public WMAppRememberMeServices(final String key) {
        super(key);
        init();
    }

    protected void init() {
        setParameter(REMEMBER_ME_PARAMETER);
    }

    @Override
    protected UserDetails processAutoLoginCookie(
            String[] cookieTokens, HttpServletRequest request,
            HttpServletResponse response) {

        if (cookieTokens.length != 3) {
            throw new InvalidCookieException("Cookie token did not contain 3" +
                    " tokens, but contained '" + Arrays.asList(cookieTokens) + "'");
        }

        long tokenExpiryTime;

        try {
            tokenExpiryTime = new Long(cookieTokens[1]);
        } catch (NumberFormatException nfe) {
            throw new InvalidCookieException("Cookie token[1] did not contain a valid number (contained '" +
                    cookieTokens[1] + "')");
        }

        if (isTokenExpired(tokenExpiryTime)) {
            throw new InvalidCookieException("Cookie token[1] has expired (expired on '"
                    + new Date(tokenExpiryTime) + "'; current time is '" + new Date() + "')");
        }


        final String username = cookieTokens[0];
        final String userSignature = cookieTokens[2];
        final UserDetails userDetails = userDetailsCache.getAuthentication(new UniqueUserId(username, userSignature));

        if (userDetails == null) {
            throw new InvalidCookieException(
                    "Could not find user details with Cookie token[2] contained signature '" + userSignature
                            + "' and ' user name " + username);
        }
        return userDetails;
    }

    @Override
    protected String extractRememberMeCookie(HttpServletRequest request) {
        if (rememberMeEnabled()) {
            return super.extractRememberMeCookie(request);
        }
        return null;
    }

    protected boolean isTokenExpired(long tokenExpiryTime) {
        return tokenExpiryTime < System.currentTimeMillis();
    }

    /**
     * Calculates the digital signature to be put in the cookie. Default value is
     * MD5 ("username:tokenExpiryTime:password:key")
     */
    protected String makeTokenSignature(long tokenExpiryTime, String username) {
        String data = username + ":" + tokenExpiryTime + ":" + UUID.randomUUID() + ":" + getKey();
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("MD5");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("No MD5 algorithm available!");
        }

        return new String(Hex.encode(digest.digest(data.getBytes())));
    }

    @Override
    public void onLoginSuccess(
            HttpServletRequest request, HttpServletResponse response,
            Authentication successfulAuthentication) {
        if (rememberMeEnabled()) {
            String username = retrieveUserName(successfulAuthentication);

            if (!StringUtils.hasLength(username)) {
                logger.debug("Unable to retrieve username");
                return;
            }

            WMUser wmUser = new WMUser(username, username, "", username, 1, true, true, true,
                    true, successfulAuthentication.getAuthorities(), System.currentTimeMillis());

            int tokenLifetime = calculateLoginLifetime(request, successfulAuthentication);
            long expiryTime = System.currentTimeMillis();

            expiryTime += 1000L * (tokenLifetime < 0 ? TWO_WEEKS_S : tokenLifetime);
            String signatureValue = makeTokenSignature(expiryTime, username);
            userDetailsCache.addToken(new UniqueUserId(username, signatureValue), wmUser);

            setCookie(new String[]{username, Long.toString(expiryTime), signatureValue}, tokenLifetime, request,
                    response);

            if (logger.isDebugEnabled()) {
                logger.debug("Added remember-me cookie for user '" + username + "', expiry: '"
                        + new Date(expiryTime) + "'");
            }
        }
    }

    protected String retrieveUserName(Authentication authentication) {
        if (isInstanceOfUserDetails(authentication)) {
            return ((UserDetails) authentication.getPrincipal()).getUsername();
        } else {
            return authentication.getPrincipal().toString();
        }
    }

    protected int calculateLoginLifetime(HttpServletRequest request, Authentication authentication) {
        return getTokenValiditySeconds();
    }

    @Override
    public String getParameter() {
        return REMEMBER_ME_PARAMETER;
    }


    private boolean rememberMeEnabled() {
        return securityConfig.getRememberMeConfig() != null && securityConfig.getRememberMeConfig().isEnabled();
    }

    private boolean isInstanceOfUserDetails(Authentication authentication) {
        return authentication.getPrincipal() instanceof UserDetails;
    }

    static class UniqueUserId {
        private String username;
        private String userSignature;

        public UniqueUserId(final String username, final String userSignature) {
            this.username = username;
            this.userSignature = userSignature;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(final String username) {
            this.username = username;
        }

        public String getUserSignature() {
            return userSignature;
        }

        public void setUserSignature(final String userSignature) {
            this.userSignature = userSignature;
        }

        @Override
        public boolean equals(final Object o) {
            if (this == o) return true;

            if (o == null || getClass() != o.getClass()) return false;

            final UniqueUserId that = (UniqueUserId) o;

            return new EqualsBuilder()
                    .append(username, that.username)
                    .append(userSignature, that.userSignature)
                    .isEquals();
        }

        @Override
        public int hashCode() {
            return new HashCodeBuilder(17, 37)
                    .append(username)
                    .append(userSignature)
                    .toHashCode();
        }
    }

}
