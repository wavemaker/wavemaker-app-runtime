package com.wavemaker.runtime.auth.oauth2;

import org.springframework.core.env.Environment;

import com.wavemaker.commons.auth.oauth2.OAuth2ProviderConfig;

public class EnvOAuth2ProviderConfig {

    private Environment environment;
    private String providerId;
    private OAuth2ProviderConfig defaultOAuth2ProviderConfig;

    public EnvOAuth2ProviderConfig(Environment environment, OAuth2ProviderConfig defaultOAuth2ProviderConfig) {
        this.environment = environment;
        this.defaultOAuth2ProviderConfig = defaultOAuth2ProviderConfig;
        this.providerId = defaultOAuth2ProviderConfig.getProviderId();
    }

    public String getProviderId() {
        return providerId;
    }

    public String getClientId() {
        return environment.getProperty(providerId + ".clientId", defaultOAuth2ProviderConfig.getClientId());
    }

    public String getClientSecret() {
        return environment.getProperty(providerId + ".clientSecret", defaultOAuth2ProviderConfig.getClientSecret());
    }

    public String getAuthorizationUrl() {
        return environment.getProperty(providerId + ".authorizationUrl", defaultOAuth2ProviderConfig.getAuthorizationUrl());
    }

    public String getAccessTokenUrl() {
        return environment.getProperty(providerId + ".accessTokenUrl", defaultOAuth2ProviderConfig.getAccessTokenUrl());
    }

    public OAuth2ProviderConfig getOAuth2ProviderConfig() {
        OAuth2ProviderConfig oAuth2ProviderConfig = new OAuth2ProviderConfig();
        oAuth2ProviderConfig.setProviderId(getProviderId());
        oAuth2ProviderConfig.setClientId(getClientId());
        oAuth2ProviderConfig.setClientSecret(getClientSecret());
        oAuth2ProviderConfig.setAuthorizationUrl(getAuthorizationUrl());
        oAuth2ProviderConfig.setAccessTokenUrl(getAccessTokenUrl());
        oAuth2ProviderConfig.setSendAccessTokenAs(this.defaultOAuth2ProviderConfig.getSendAccessTokenAs());
        oAuth2ProviderConfig.setAccessTokenParamName(this.defaultOAuth2ProviderConfig.getAccessTokenParamName());
        oAuth2ProviderConfig.setScopes(this.defaultOAuth2ProviderConfig.getScopes());
        return oAuth2ProviderConfig;
    }
}
