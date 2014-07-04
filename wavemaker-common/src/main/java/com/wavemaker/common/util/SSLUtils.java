package com.wavemaker.common.util;

import java.security.SecureRandom;
import java.security.cert.X509Certificate;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.common.WMRuntimeException;

/**
 * @author Uday Shankar
 */
public class SSLUtils {

    private static final Logger logger = LoggerFactory.getLogger(SSLUtils.class);

    private static SSLContext allTrustedSSLContext;

    public static SSLContext getAllTrustedCertificateSSLContext() {
        if (allTrustedSSLContext == null) {

            // Create a trust manager that does not validate certificate chains
            TrustManager[] trustAllCerts = new TrustManager[]{new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() {
                    return null;
                }

                public void checkClientTrusted(X509Certificate[] certs, String authType) {
                }

                public void checkServerTrusted(X509Certificate[] certs, String authType) {
                }
            }};

            // Install the all-trusting trust manager
            SSLContext sc;
            try {
                sc = SSLContext.getInstance("TLS");
                sc.init(null, trustAllCerts, new SecureRandom());
                allTrustedSSLContext = sc;
            } catch (Exception e) {
                logger.warn("Failed in initialize ssl context", e);
                throw new WMRuntimeException("Failed in initialize ssl context",e);
            }
        }
        return allTrustedSSLContext;
    }
}
