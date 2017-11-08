package com.wavemaker.runtime.ssl;

import javax.net.ssl.SSLSocketFactory;

import org.springframework.beans.factory.FactoryBean;

import com.wavemaker.commons.util.SSLUtils;

/**
 * @author Uday Shankar
 */
public class SSLSocketFactoryFactoryBean implements FactoryBean<SSLSocketFactory> {
    
    @Override
    public SSLSocketFactory getObject() throws Exception {
        return SSLUtils.getAllTrustedCertificateSSLContext().getSocketFactory();
    }

    @Override
    public Class<?> getObjectType() {
        return SSLSocketFactory.class;
    }

    @Override
    public boolean isSingleton() {
        return true;
    }
}
