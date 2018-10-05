/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Reader;
import java.io.StringWriter;
import java.io.Writer;
import java.net.URL;
import java.nio.charset.Charset;
import java.time.LocalDateTime;
import java.util.Date;

import org.apache.commons.io.IOUtils;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpHeaders;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.TreeNode;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.cfg.MapperConfig;
import com.fasterxml.jackson.databind.introspect.AnnotatedMethod;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.FilterProvider;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.fasterxml.jackson.datatype.hibernate5.Hibernate5Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.wavemaker.commons.json.deserializer.HttpHeadersDeSerializer;
import com.wavemaker.commons.json.deserializer.WMDateDeSerializer;
import com.wavemaker.commons.json.deserializer.WMSqlDateDeSerializer;
import com.wavemaker.commons.json.serializer.NoOpByteArraySerializer;
import com.wavemaker.commons.json.serializer.WMLocalDateTimeSerializer;
import com.wavemaker.runtime.mixins.SliceMixin;

public class WMObjectMapper extends ObjectMapper {

    private static WMObjectMapper instance = new WMObjectMapper();
    private static WMPropertyNamingStrategy PROPERTY_NAMING_STRATEGY = new WMPropertyNamingStrategy();

    private WMObjectReadMapper readMapper = null;
    private WMObjectWriteMapper writeMapper = null;

    protected WMObjectMapper() {
        readMapper = new WMObjectReadMapper();
        writeMapper = new WMObjectWriteMapper();
    }

    public static WMObjectMapper getInstance() {
        return instance;
    }

    /**
     * Method that can be used to serialize any Java value as
     * JSON output, written to File provided.
     */
    @Override
    public void writeValue(File resultFile, Object value)
            throws IOException {
        writeMapper.writeValue(resultFile, value);
    }

    @Override
    public void writeValue(OutputStream out, Object value)
            throws IOException {
        writeMapper.writeValue(out, value);
    }

    @Override
    public void writeValue(Writer w, Object value)
            throws IOException {
        writeMapper.writeValue(w, value);
    }

    @Override
    public String writeValueAsString(Object value)
            throws JsonProcessingException {
        return writeMapper.writeValueAsString(value);
    }

    @Override
    public byte[] writeValueAsBytes(Object value)
            throws JsonProcessingException {
        return writeMapper.writeValueAsBytes(value);
    }

    @Override
    public void writeTree(JsonGenerator jgen, TreeNode rootNode) throws IOException {
        writeMapper.writeTree(jgen, rootNode);
    }

    @Override
    public void writeValue(JsonGenerator jgen, Object value) throws IOException {
        writeMapper.writeValue(jgen, value);
    }

    @Override
    public void writeTree(JsonGenerator jgen, JsonNode rootNode) throws IOException {
        writeMapper.writeValue(jgen, rootNode);
    }

    @Override
    public ObjectWriter writer() {
        return writeMapper.writer();
    }

    @Override
    public ObjectWriter writerWithView(final Class<?> serializationView) {
        return writeMapper.writerWithView(serializationView);
    }

    @Override
    public ObjectWriter writer(final FilterProvider filterProvider) {
        return writeMapper.writer(filterProvider);
    }

    @Override
    public <T> T readValue(File src, Class<T> valueType)
            throws IOException {
        return readMapper.readValue(src, valueType);
    }

    @Override
    public <T> T readValue(File src, TypeReference valueTypeRef)
            throws IOException {
        return readMapper.readValue(src, valueTypeRef);
    }

    @Override
    public <T> T readValue(File src, JavaType valueType)
            throws IOException {
        return readMapper.readValue(src, valueType);
    }

    @Override
    public <T> T readValue(URL src, Class<T> valueType)
            throws IOException {

        return readMapper.readValue(src, valueType);
    }

    @Override
    public <T> T readValue(URL src, TypeReference valueTypeRef)
            throws IOException {
        return readMapper.readValue(src, valueTypeRef);
    }

    @Override
    public <T> T readValue(URL src, JavaType valueType)
            throws IOException {
        return readMapper.readValue(src, valueType);
    }

    @Override
    public <T> T readValue(String content, Class<T> valueType)
            throws IOException {
        return readMapper.readValue(content, valueType);
    }

    @Override
    public <T> T readValue(String content, TypeReference valueTypeRef)
            throws IOException {
        return readMapper.readValue(content, valueTypeRef);
    }

    @Override
    public <T> T readValue(String content, JavaType valueType)
            throws IOException {
        return readMapper.readValue(content, valueType);
    }

    @Override
    public <T> T readValue(Reader src, Class<T> valueType)
            throws IOException {
        return readMapper.readValue(src, valueType);
    }

    @Override
    public <T> T readValue(Reader src, TypeReference valueTypeRef)
            throws IOException {
        return readMapper.readValue(src, valueTypeRef);
    }

    @Override
    public <T> T readValue(Reader src, JavaType valueType)
            throws IOException {
        return readMapper.readValue(src, valueType);
    }

    @Override
    public <T> T readValue(InputStream src, Class<T> valueType)
            throws IOException {
        return readMapper.readValue(src, valueType);
    }

    @Override
    public <T> T readValue(InputStream src, TypeReference valueTypeRef)
            throws IOException {
        return readMapper.readValue(src, valueTypeRef);
    }

    @Override
    public <T> T readValue(byte[] src, Class<T> valueType)
            throws IOException {
        return readMapper.readValue(src, valueType);
    }

    @Override
    public <T> T readValue(
            byte[] src, int offset, int len,
            Class<T> valueType)
            throws IOException {
        return readMapper.readValue(src, offset, len, valueType);
    }

    @Override
    public <T> T readValue(byte[] src, TypeReference valueTypeRef)
            throws IOException {
        return readMapper.readValue(src, valueTypeRef);
    }

    @Override
    public <T> T readValue(
            byte[] src, int offset, int len,
            TypeReference valueTypeRef)
            throws IOException {
        return readMapper.readValue(src, offset, len, valueTypeRef);
    }

    @Override
    public <T> T readValue(byte[] src, JavaType valueType)
            throws IOException {
        return readMapper.readValue(src, valueType);
    }

    @Override
    public <T> T readValue(
            byte[] src, int offset, int len,
            JavaType valueType)
            throws IOException {
        return readMapper.readValue(src, offset, len, valueType);
    }

    @Override
    public <T> T readValue(InputStream src, JavaType valueType) throws IOException {
        if (String.class.equals(valueType.getRawClass())) {
            StringWriter stringWriter = new StringWriter();
            IOUtils.copy(src, stringWriter, Charset.defaultCharset());
            return (T) stringWriter.toString();
        }
        return readMapper.readValue(src, valueType);
    }

    @Override
    public ObjectReader reader() {
        return readMapper.reader();
    }

    public void registerReaderModule(final Module mapperModule) {
        readMapper.registerModule(mapperModule);
    }

    private static class WMObjectReadMapper extends ObjectMapper {

        WMObjectReadMapper() {
            setTypeFactory(TypeFactory.defaultInstance().withClassLoader(WMObjectReadMapper.class.getClassLoader()));
            configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            SimpleModule module = new SimpleModule("WMDefaultDeSerializer");

            module.addDeserializer(Date.class, new WMDateDeSerializer());
            module.addDeserializer(java.sql.Date.class, new WMSqlDateDeSerializer());
            module.addDeserializer(HttpHeaders.class, new HttpHeadersDeSerializer());
            registerModule(module);

            JavaTimeModule javaTimeModule = new JavaTimeModule();
            registerModule(javaTimeModule);

            setPropertyNamingStrategy(PROPERTY_NAMING_STRATEGY);
        }
    }

    private static class WMObjectWriteMapper extends ObjectMapper {

        WMObjectWriteMapper() {
            setTypeFactory(TypeFactory.defaultInstance().withClassLoader(WMObjectWriteMapper.class.getClassLoader()));
            disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
            configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            // we are handling self references using @JsonIgnoreProperties
            configure(SerializationFeature.FAIL_ON_SELF_REFERENCES, false);
            setConfig(getSerializationConfig().withView(Object.class));

            // mixing to ignore pageable field from page response.
            addMixIn(Slice.class, SliceMixin.class);

            Hibernate5Module hibernate5Module = new Hibernate5Module();
            hibernate5Module.disable(Hibernate5Module.Feature.FORCE_LAZY_LOADING);
            registerModule(hibernate5Module);

            SimpleModule module = new SimpleModule("WMDefaultSerializer");
            module.addSerializer(byte[].class, new NoOpByteArraySerializer());
            registerModule(module);

            JavaTimeModule javaTimeModule = new JavaTimeModule();
            javaTimeModule.addSerializer(LocalDateTime.class, new WMLocalDateTimeSerializer());
            registerModule(javaTimeModule);

            // will add once anyGetter issue fixed.
//            registerModule(new WMJacksonModule(false));

            setPropertyNamingStrategy(PROPERTY_NAMING_STRATEGY);
        }
    }

    private static class WMPropertyNamingStrategy extends PropertyNamingStrategy {

        private static final String[] POSSIBLE_GET_METHOD_START_NAMES = {"get", "is"};
        private static final String[] POSSIBLE_SET_METHOD_START_NAMES = {"set"};

        @Override
        public String nameForGetterMethod(MapperConfig<?> config, AnnotatedMethod method, String defaultName) {
            return getPossibleFieldName(method, defaultName, POSSIBLE_GET_METHOD_START_NAMES);
        }

        @Override
        public String nameForSetterMethod(MapperConfig<?> config, AnnotatedMethod method, String defaultName) {
            return getPossibleFieldName(method, defaultName, POSSIBLE_SET_METHOD_START_NAMES);
        }

        private String getPossibleFieldName(
                AnnotatedMethod method, String defaultName, String[] possibleMethodStartNames) {
            String name = method.getName();
            for (String possibleStartName : possibleMethodStartNames) {
                if (name.startsWith(possibleStartName)) {
                    String remPart = name.substring(possibleStartName.length());
                    if (remPart.isEmpty()) {
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
