package com.wavemaker.runtime.ssl;

import javax.net.ssl.HostnameVerifier;

import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.springframework.beans.factory.FactoryBean;

/**
 * @author Uday Shankar
 */
public class HostnameVerifierFactoryBean implements FactoryBean<HostnameVerifier> {
    
    @Override
    public HostnameVerifier getObject() throws Exception {
        return NoopHostnameVerifier.INSTANCE;
    }

    @Override
    public Class<?> getObjectType() {
        return HostnameVerifier.class;
    }

    @Override
    public boolean isSingleton() {
        return true;
    }
}
