/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.ws;

import java.io.IOException;

import org.apache.http.impl.cookie.BasicClientCookie;
import org.testng.annotations.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.wavemaker.runtime.WMObjectMapper;

import static org.testng.Assert.assertEquals;

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