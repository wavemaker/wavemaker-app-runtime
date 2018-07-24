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
package com.wavemaker.runtime.converters;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;

/**
 * @Author: Uday
 */
public class WMCompositeHttpMessageConverter<T> implements HttpMessageConverter<T> {

    private List<WMCustomAbstractHttpMessageConverter> httpMessageConverterList = new ArrayList<>();

    private List<MediaType> supportedMediaTypes = new ArrayList<>();

    public WMCompositeHttpMessageConverter() {
        this.supportedMediaTypes.add(MediaType.ALL);
        this.httpMessageConverterList.add(new DateHttpMessageConverter());
        this.httpMessageConverterList.add(new DownloadableHttpMessageConverter());

    }

    @Override
    public boolean canRead(Class<?> clazz, MediaType mediaType) {
        for (HttpMessageConverter httpMessageConverter : httpMessageConverterList) {
            if (httpMessageConverter.canRead(clazz, mediaType)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public boolean canWrite(Class<?> clazz, MediaType mediaType) {
        for (HttpMessageConverter httpMessageConverter : httpMessageConverterList) {
            if (httpMessageConverter.canWrite(clazz, mediaType)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public List<MediaType> getSupportedMediaTypes() {
        return supportedMediaTypes;
    }

    @Override
    public T read(Class<? extends T> clazz, HttpInputMessage inputMessage) throws IOException {
        for (WMCustomHttpMessageConverter httpMessageConverter : httpMessageConverterList) {
            if (httpMessageConverter.supportsClazz(clazz)) {
                return (T) httpMessageConverter.read(clazz, inputMessage);
            }
        }
        throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.unreadable.type"), clazz.getName());
    }

    @Override
    public void write(T t, MediaType contentType, HttpOutputMessage outputMessage)
            throws IOException {
        for (WMCustomHttpMessageConverter httpMessageConverter : httpMessageConverterList) {
            if (httpMessageConverter.supportsClazz(t.getClass())) {
                httpMessageConverter.write(t, null, outputMessage);
                return;
            }
        }
        throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.unwritable.type"), t.getClass().getName());
    }
}

