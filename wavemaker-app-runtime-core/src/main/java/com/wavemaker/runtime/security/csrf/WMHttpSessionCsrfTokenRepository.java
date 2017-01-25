package com.wavemaker.runtime.security.csrf;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;

import com.wavemaker.runtime.security.config.WMAppSecurityConfig;
import com.wavemaker.commons.model.security.CSRFConfig;

/**
 * Created by kishorer on 7/7/16.
 */
public class WMHttpSessionCsrfTokenRepository extends AbstractCsrfTokenRepository implements InitializingBean {

    private CSRFConfig csrfConfig;
    private HttpSessionCsrfTokenRepository tokenRepository;

    public WMHttpSessionCsrfTokenRepository(HttpSessionCsrfTokenRepository tokenRepository) {
        super(tokenRepository);
        this.tokenRepository = tokenRepository;
    }

    public void setCsrfConfig(final CSRFConfig csrfConfig) {
        this.csrfConfig = csrfConfig;
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        updateRepositoryProperties();
    }

    private void updateRepositoryProperties() {
        if (csrfConfig != null) {
            String headerName = csrfConfig.getHeaderName();
            tokenRepository.setHeaderName(headerName);
        }
    }
}
