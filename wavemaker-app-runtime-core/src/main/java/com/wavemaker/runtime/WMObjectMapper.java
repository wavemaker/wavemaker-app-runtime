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

import java.io.*;
import java.net.URL;

import org.apache.commons.io.IOUtils;

import com.fasterxml.jackson.core.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.cfg.MapperConfig;
import com.fasterxml.jackson.databind.introspect.AnnotatedMethod;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.hibernate4.Hibernate4Module;
import com.wavemaker.runtime.data.json.WMHibernate4Module;

public class WMObjectMapper extends ObjectMapper {

    private static WMObjectMapper instance = new WMObjectMapper();
    private static WMPropertyNamingStrategy PROPERTY_NAMING_STRATEGY = new WMPropertyNamingStrategy();

    private WMObjectReadMapper readMapper = null;
    private WMObjectwritMapper writeMapper = null;

    private WMObjectMapper() {
        readMapper = new WMObjectReadMapper();
        writeMapper = new WMObjectwritMapper();
    }

    public static WMObjectMapper getInstance() {
        return instance;
    }

    /**
     * Method that can be used to serialize any Java value as
     * JSON output, written to File provided.
     */
    public void writeValue(File resultFile, Object value)
            throws IOException, JsonGenerationException, JsonMappingException {
        writeMapper.writeValue(resultFile, value);
    }

    public void writeValue(OutputStream out, Object value)
            throws IOException, JsonGenerationException, JsonMappingException {
        writeMapper.writeValue(out, value);
    }

    public void writeValue(Writer w, Object value)
            throws IOException, JsonGenerationException, JsonMappingException {
        writeMapper.writeValue(w, value);
    }

    public String writeValueAsString(Object value)
            throws JsonProcessingException {
        return writeMapper.writeValueAsString(value);
    }

    public byte[] writeValueAsBytes(Object value)
            throws JsonProcessingException {
        return writeMapper.writeValueAsBytes(value);
    }

    @Override
    public void writeTree(JsonGenerator jgen, TreeNode rootNode) throws IOException, JsonProcessingException {
         writeMapper.writeTree(jgen, rootNode);
    }

    @Override
    public void writeValue(JsonGenerator jgen, Object value) throws IOException, JsonGenerationException, JsonMappingException {
        writeMapper.writeValue(jgen, value);
    }

    @Override
    public void writeTree(JsonGenerator jgen, JsonNode rootNode) throws IOException, JsonProcessingException {
        writeMapper.writeValue(jgen, rootNode);
    }


    public <T> T readValue(File src, Class<T> valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueType);
    }

    public <T> T readValue(File src, TypeReference valueTypeRef)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueTypeRef);
    }

    public <T> T readValue(File src, JavaType valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueType);
    }

    public <T> T readValue(URL src, Class<T> valueType)
            throws IOException, JsonParseException, JsonMappingException {

        return readMapper.readValue(src, valueType);
    }

    public <T> T readValue(URL src, TypeReference valueTypeRef)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueTypeRef);
    }

    public <T> T readValue(URL src, JavaType valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueType);
    }

    public <T> T readValue(String content, Class<T> valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(content, valueType);
    }

    public <T> T readValue(String content, TypeReference valueTypeRef)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(content, valueTypeRef);
    }

    public <T> T readValue(String content, JavaType valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(content, valueType);
    }

    public <T> T readValue(Reader src, Class<T> valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueType);
    }

    public <T> T readValue(Reader src, TypeReference valueTypeRef)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueTypeRef);
    }

    public <T> T readValue(Reader src, JavaType valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueType);
    }

    public <T> T readValue(InputStream src, Class<T> valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueType);
    }

    public <T> T readValue(InputStream src, TypeReference valueTypeRef)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueTypeRef);
    }

    public <T> T readValue(byte[] src, Class<T> valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueType);
    }

    public <T> T readValue(byte[] src, int offset, int len,
                           Class<T> valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, offset, len, valueType);
    }

    public <T> T readValue(byte[] src, TypeReference valueTypeRef)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueTypeRef);
    }

    public <T> T readValue(byte[] src, int offset, int len,
                           TypeReference valueTypeRef)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, offset, len, valueTypeRef);
    }

    public <T> T readValue(byte[] src, JavaType valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, valueType);
    }

    public <T> T readValue(byte[] src, int offset, int len,
                           JavaType valueType)
            throws IOException, JsonParseException, JsonMappingException {
        return readMapper.readValue(src, offset, len, valueType);
    }

    public <T> T readValue(InputStream src, JavaType valueType) throws IOException {
        if (String.class.equals(valueType.getRawClass())) {
            StringWriter stringWriter = new StringWriter();
            IOUtils.copy(src, stringWriter);
            return (T) stringWriter.toString();
        }
        return readMapper.readValue(src, valueType);
    }

    private static class WMObjectReadMapper extends ObjectMapper {

        WMObjectReadMapper() {
            configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            SimpleModule byteModule = new SimpleModule("ByteArraySerializeModule", new Version(1, 0, 0, null));
            ByteArraySerializeModule byteArraySerializeModule = new ByteArraySerializeModule();
            byteModule.addSerializer(byte[].class, byteArraySerializeModule);
            registerModules(byteModule);
            setPropertyNamingStrategy(PROPERTY_NAMING_STRATEGY);
        }
    }

    private static class WMObjectwritMapper extends ObjectMapper {

        WMObjectwritMapper() {
            configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            WMHibernate4Module hibernate4Module = new WMHibernate4Module();
            hibernate4Module.disable(Hibernate4Module.Feature.FORCE_LAZY_LOADING);
            registerModule(hibernate4Module);

            SimpleModule module = new SimpleModule("ByteArraySerializeModule",new Version(1, 0, 0, null));
            ByteArraySerializeModule byteArrayDeserializerModule =  new ByteArraySerializeModule();
            module.addSerializer(byte[].class, byteArrayDeserializerModule);
            registerModule(module);
            setPropertyNamingStrategy(PROPERTY_NAMING_STRATEGY);
        }
    }

    private static class WMPropertyNamingStrategy extends PropertyNamingStrategy {

        private static final String[] POSSIBLE_GET_METHOD_START_NAMES = new String[] {"get", "is"};
        private static final String[] POSSIBLE_SET_METHOD_START_NAMES = new String[] {"set"};

        @Override
        public String nameForGetterMethod(MapperConfig<?> config, AnnotatedMethod method, String defaultName) {
            return getPossibleFieldName(method, defaultName, POSSIBLE_GET_METHOD_START_NAMES);
        }

        @Override
        public String nameForSetterMethod(MapperConfig<?> config, AnnotatedMethod method, String defaultName) {
            return getPossibleFieldName(method, defaultName, POSSIBLE_SET_METHOD_START_NAMES);
        }

        private String getPossibleFieldName(AnnotatedMethod method, String defaultName, String[] possibleMethodStartNames) {
            String name = method.getName();
            for (int i=0; i< possibleMethodStartNames.length; i++) {
                String possibleStartName = possibleMethodStartNames[i];
                if (name.startsWith(possibleStartName)) {
                    String remPart = name.substring(possibleStartName.length());
                    if (remPart.length() == 0) {
                        break;
                    }
                    char upper = remPart.charAt(0);
                    char lower = Character.toLowerCase(upper);
                    if (lower == upper) {
                        break;
                    }
                    StringBuilder sb = new StringBuilder(remPart);
                    sb.setCharAt(0, lower);
                    return sb.toString();
                }
            }
            return defaultName;
        }
    }

}
