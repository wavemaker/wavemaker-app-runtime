package com.wavemaker.runtime.security.provider.saml;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.RuntimeEnvironment;

/**
 * Created by ArjunSahasranam on 24/11/16.
 */
public class LoadKeyStoreInitializer {

    private static final Logger logger = LoggerFactory.getLogger(LoadKeyStoreInitializer.class);
    private static final String SAML_HTTP_METADATA_PROVIDER_CLAZZ = "org.opensaml.saml2.metadata.provider.HTTPMetadataProvider";

    public LoadKeyStoreInitializer() {
        init();
    }

    public void init() {
        if (RuntimeEnvironment.isTestRunEnvironment()) {
            logger.info("saml keystore for profile does not load in test environment");
            return;
        }

        Class<?> samlHttpMetadataProviderClazz = null;
        try {
            samlHttpMetadataProviderClazz = Class
                    .forName(SAML_HTTP_METADATA_PROVIDER_CLAZZ, false, Thread.currentThread().getContextClassLoader());
        } catch (ClassNotFoundException e) {
            logger.info("saml classes not found in classpath.");
        }
        if (samlHttpMetadataProviderClazz != null) {
            LoadKeyStore loadKeyStore = new LoadKeyStore();
            loadKeyStore.load();
        }
    }

}

