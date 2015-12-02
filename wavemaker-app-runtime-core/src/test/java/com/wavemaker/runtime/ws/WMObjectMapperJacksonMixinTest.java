package com.wavemaker.runtime.ws;

import java.io.IOException;

import org.apache.http.impl.cookie.BasicClientCookie;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.wavemaker.runtime.WMObjectMapper;
import com.wavemaker.runtime.rest.model.RestResponseModule;
import org.testng.annotations.Test;
import static org.testng.Assert.*;

/**
 * Created to test Jackson mixin for BasicClientCookie.
 *
 * Created by ArjunSahasranam on 10/9/15.
 */
public class WMObjectMapperJacksonMixinTest {

    public static final String NAME = "sample";
    public static final String VALUE = "sampl1234";

    @Test
    public void test() throws IOException {
        final BasicClientCookie origCookie = new BasicClientCookie(NAME,
                VALUE);
        ObjectMapper objectMapper = WMObjectMapper.getInstance();

        final ObjectWriter writer = objectMapper.writer();
        final ObjectReader reader = objectMapper.reader();

        String wrt = writer.withType(BasicClientCookie.class).writeValueAsString(origCookie);
        final BasicClientCookie cookie = reader.withType(BasicClientCookie.class).readValue(wrt);

        assertEquals(origCookie.getName(), cookie.getName());
        assertEquals(origCookie.getValue(), cookie.getValue());
    }
}