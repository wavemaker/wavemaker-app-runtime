package com.wavemaker.runtime.security.xss.deserializer;

import java.io.IOException;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.wavemaker.runtime.security.xss.handler.XSSSecurityHandler;

/**
 * Created by kishorer on 30/6/16.
 */
public class XssStringDeserializer extends JsonDeserializer<String> {


    @Override
    public String deserialize(JsonParser jp, DeserializationContext context) throws IOException {
        String data = jp.getText();
        XSSSecurityHandler xssSecurityHandler = XSSSecurityHandler.getInstance();
        return xssSecurityHandler.sanitizeRequestData(data);
    }
}
