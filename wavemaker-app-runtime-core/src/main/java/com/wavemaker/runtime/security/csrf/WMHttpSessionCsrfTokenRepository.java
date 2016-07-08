package com.wavemaker.runtime.security.csrf;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;

import com.wavemaker.runtime.security.config.WMAppSecurityConfig;
import com.wavemaker.studio.common.model.security.CSRFConfig;

/**
 * Created by kishorer on 7/7/16.
 */
public class WMHttpSessionCsrfTokenRepository implements CsrfTokenRepository, InitializingBean {

    private WMAppSecurityConfig wmAppSecurityConfig;
    private HttpSessionCsrfTokenRepository repository;

    public WMHttpSessionCsrfTokenRepository() {
        repository = new HttpSessionCsrfTokenRepository();
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        updateRepositoryProperties();
    }

    public void setWmAppSecurityConfig(WMAppSecurityConfig wmAppSecurityConfig) {
        this.wmAppSecurityConfig = wmAppSecurityConfig;
    }

    @Override
    public CsrfToken generateToken(HttpServletRequest request) {
        return repository.generateToken(request);
    }

    @Override
    public void saveToken(CsrfToken token, HttpServletRequest request, HttpServletResponse response) {
        repository.saveToken(token, request, response);
    }

    @Override
    public CsrfToken loadToken(HttpServletRequest request) {
        return repository.loadToken(request);
    }


    private void updateRepositoryProperties() {
        CSRFConfig csrfConfig = wmAppSecurityConfig.getCsrfConfig();
        if (csrfConfig != null) {
            String headerName = csrfConfig.getHeaderName();
            repository.setHeaderName(headerName);
        }
    }
}
