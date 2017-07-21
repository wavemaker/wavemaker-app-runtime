package com.wavemaker.runtime.oauth;

import com.wavemaker.runtime.service.reflect.ReflectServiceType;

/**
 * Created by srujant on 20/7/17.
 */
public class OAuthServiceType extends ReflectServiceType {

    public static final String TYPE_NAME = "oauthService";

    @Override
    public String getTypeName() {
        return TYPE_NAME;
    }
}

