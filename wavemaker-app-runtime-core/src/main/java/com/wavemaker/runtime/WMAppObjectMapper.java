package com.wavemaker.runtime;

import com.wavemaker.runtime.security.xss.XssEscapeModule;

/**
 * Created by kishorer on 30/6/16.
 */
public class WMAppObjectMapper extends WMObjectMapper {

    private static WMAppObjectMapper instance = new WMAppObjectMapper();

    public static WMAppObjectMapper getInstance() {
        return instance;
    }

    private WMAppObjectMapper() {
        super();
        registerReaderModule(new XssEscapeModule());
    }

}
