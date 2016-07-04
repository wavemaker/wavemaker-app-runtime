package com.wavemaker.runtime.security.xss;

import com.fasterxml.jackson.core.Version;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.wavemaker.runtime.security.xss.deserializer.XssStringDeserializer;

/**
 * Created by kishorer on 30/6/16.
 */
public class XssEscapeModule extends SimpleModule {

    public XssEscapeModule() {
        super("XssEscapeModule", new Version(8, 2, 0, null, null, null));
        addDeserializer(String.class, new XssStringDeserializer());
    }
}

