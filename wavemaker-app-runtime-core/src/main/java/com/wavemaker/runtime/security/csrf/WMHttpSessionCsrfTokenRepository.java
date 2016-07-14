package com.wavemaker.runtime.security.csrf;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;

import com.wavemaker.runtime.security.config.WMAppSecurityConfig;
import com.wavemaker.studio.common.model.security.CSRFConfig;

/**
 * Created by kishorer on 7/7/16.
 */
public class WMHttpSessionCsrfTokenRepository extends AbstractCsrfTokenRepository implements InitializingBean {

    private WMAppSecurityConfig wmAppSecurityConfig;
    private HttpSessionCsrfTokenRepository tokenRepository;

    public WMHttpSessionCsrfTokenRepository(HttpSessionCsrfTokenRepository tokenRepository) {
        super(tokenRepository);
        this.tokenRepository = tokenRepository;
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        updateRepositoryProperties();
    }

    public void setWmAppSecurityConfig(WMAppSecurityConfig wmAppSecurityConfig) {
        this.wmAppSecurityConfig = wmAppSecurityConfig;
    }

    private void updateRepositoryProperties() {
        CSRFConfig csrfConfig = wmAppSecurityConfig.getCsrfConfig();
        if (csrfConfig != null) {
            String headerName = csrfConfig.getHeaderName();
            tokenRepository.setHeaderName(headerName);
        }
    }
}
