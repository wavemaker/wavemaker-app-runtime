package com.wavemaker.runtime.security.provider.ldap;

import java.util.Arrays;
import java.util.Hashtable;

import org.springframework.security.ldap.DefaultSpringSecurityContextSource;

/**
 * @author Kishore Routhu on 5/1/18 2:29 PM.
 */
public class WMSpringSecurityContextSource extends DefaultSpringSecurityContextSource {

    private static final String CONNECT_TIMEOUT_ENV_PROPERTY = "com.sun.jndi.ldap.connect.timeout";
    private static final String READ_TIMEOUT_ENV_PROPERTY = "com.sun.jndi.ldap.read.timeout";
    private static final String URL_SEPARATOR = " ";

    private final String DEFAULT_TIME_OUT = "30000";

    public WMSpringSecurityContextSource(String providerUrl) {
        super(providerUrl);
    }

    public WMSpringSecurityContextSource(String providerUrl, String baseDn) {
        super(Arrays.asList(providerUrl.split(URL_SEPARATOR)), baseDn);
    }

    @Override
    protected Hashtable<String, Object> getAuthenticatedEnv(String principal, String credentials) {
        Hashtable<String, Object> authenticatedEnv = super.getAuthenticatedEnv(principal, credentials);
        authenticatedEnv.put(CONNECT_TIMEOUT_ENV_PROPERTY, DEFAULT_TIME_OUT);
        authenticatedEnv.put(READ_TIMEOUT_ENV_PROPERTY, DEFAULT_TIME_OUT);
        return authenticatedEnv;
    }
}
