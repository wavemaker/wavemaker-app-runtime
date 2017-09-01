package com.wavemaker.runtime.oauth2;

import com.wavemaker.runtime.service.reflect.ReflectServiceType;

/**
 * Created by srujant on 20/7/17.
 */
public class AuthServiceType extends ReflectServiceType {

    public static final String TYPE_NAME = "authService";

    @Override
    public String getTypeName() {
        return TYPE_NAME;
    }
}

