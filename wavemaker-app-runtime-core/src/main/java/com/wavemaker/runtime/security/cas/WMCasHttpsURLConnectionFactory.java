package com.wavemaker.runtime.security.cas;

import java.net.HttpURLConnection;
import java.net.URLConnection;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSocketFactory;

import org.jasig.cas.client.ssl.HttpURLConnectionFactory;

/**
 * @author Uday Shankar
 */
public class WMCasHttpsURLConnectionFactory implements HttpURLConnectionFactory {
    
    private SSLSocketFactory sslSocketFactory;
    
    private HostnameVerifier hostnameVerifier;
    
    
    @Override
    public HttpURLConnection buildHttpURLConnection(URLConnection conn) {
        if (conn instanceof HttpsURLConnection) {
            HttpsURLConnection httpsConnection = (HttpsURLConnection) conn;
            if (sslSocketFactory != null) {
                httpsConnection.setSSLSocketFactory(sslSocketFactory);
            }
            if (hostnameVerifier != null) {
                httpsConnection.setHostnameVerifier(hostnameVerifier);
            }
        }
        return (HttpURLConnection) conn;
    }

    public void setSslSocketFactory(SSLSocketFactory sslSocketFactory) {
        this.sslSocketFactory = sslSocketFactory;
    }

    public void setHostnameVerifier(HostnameVerifier hostnameVerifier) {
        this.hostnameVerifier = hostnameVerifier;
    }
}
