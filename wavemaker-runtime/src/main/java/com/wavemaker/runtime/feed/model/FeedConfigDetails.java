package com.wavemaker.runtime.feed.model;

/**
 * Created by sunilp on 11/3/15.
 */
public class FeedConfigDetails {

    private String url;
    private String httpBasicAuthUsername;
    private String httpBasicAuthPassword;
    private int connectionTimeout;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getHttpBasicAuthUsername() {
        return httpBasicAuthUsername;
    }

    public void setHttpBasicAuthUsername(String httpBasicAuthUsername) {
        this.httpBasicAuthUsername = httpBasicAuthUsername;
    }

    public String getHttpBasicAuthPassword() {
        return httpBasicAuthPassword;
    }

    public void setHttpBasicAuthPassword(String httpBasicAuthPassword) {
        this.httpBasicAuthPassword = httpBasicAuthPassword;
    }

    public int getConnectionTimeout() {
        return connectionTimeout;
    }

    public void setConnectionTimeout(int connectionTimeout) {
        this.connectionTimeout = connectionTimeout;
    }
}
