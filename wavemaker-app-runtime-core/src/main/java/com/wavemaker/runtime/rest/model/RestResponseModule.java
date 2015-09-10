package com.wavemaker.runtime.rest.model;

import org.apache.http.impl.cookie.BasicClientCookie;

import com.fasterxml.jackson.core.Version;
import com.fasterxml.jackson.databind.module.SimpleModule;

/**
 * Created by ArjunSahasranam on 10/9/15.
 */
public class RestResponseModule extends SimpleModule {
    public RestResponseModule() {
        super("RestResponseModule", new Version(8, 0, 0, null, null, null));
    }

    @Override
    public void setupModule(final SetupContext context) {
        context.setMixInAnnotations(BasicClientCookie.class, BasicClientCookieMixIn.class);
    }
}
