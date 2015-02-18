package com.wavemaker.runtime.soap;

import com.wavemaker.runtime.service.reflect.ReflectServiceType;

/**
 * Created by shivangi on 20/12/14.
 */
public class SoapServiceType extends ReflectServiceType {

    public static final String TYPE_NAME = "SoapService";
    @Override
    public String getTypeName() {
        return TYPE_NAME;
    }
}
