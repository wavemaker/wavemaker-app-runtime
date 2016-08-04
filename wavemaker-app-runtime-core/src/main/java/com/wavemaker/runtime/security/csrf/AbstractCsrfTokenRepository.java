package com.wavemaker.runtime.security.csrf;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;

/**
 * Created by kishorer on 13/7/16.
 */
public abstract class AbstractCsrfTokenRepository implements CsrfTokenRepository {

    private CsrfTokenRepository delegator;

    protected AbstractCsrfTokenRepository(CsrfTokenRepository csrfTokenRepository) {
        this.delegator = csrfTokenRepository;
    }

    @Override
    public CsrfToken generateToken(HttpServletRequest request) {
        return this.delegator.generateToken(request);
    }

    @Override
    public void saveToken(CsrfToken token, HttpServletRequest request, HttpServletResponse response) {
        this.delegator.saveToken(token, request, response);
    }

    @Override
    public CsrfToken loadToken(HttpServletRequest request) {
        return this.delegator.loadToken(request);
    }
}
