/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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
package com.wavemaker.runtime;

import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;

import org.apache.commons.io.IOUtils;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.hibernate4.Hibernate4Module;
import com.wavemaker.runtime.data.json.WMHibernate4Module;

public class WMObjectMapper extends ObjectMapper {

    private static WMObjectMapper instance = new WMObjectMapper();

    private WMObjectMapper() {
        configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        WMHibernate4Module hibernate4Module = new WMHibernate4Module();
        hibernate4Module.disable(Hibernate4Module.Feature.FORCE_LAZY_LOADING);
        registerModule(hibernate4Module);
    }

    public <T> T readValue(InputStream src, JavaType valueType) throws IOException {
        if(String.class.equals(valueType.getRawClass())) {
            StringWriter stringWriter = new StringWriter();
            IOUtils.copy(src, stringWriter);
            return (T) stringWriter.toString();
        }
        return super.readValue(src, valueType);
    }

    public static WMObjectMapper getInstance() {
        return instance;
    }
}
