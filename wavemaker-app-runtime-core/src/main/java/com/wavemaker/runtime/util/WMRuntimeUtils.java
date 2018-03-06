/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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
package com.wavemaker.runtime.util;

import java.io.File;
import java.lang.reflect.Field;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.ResourceHttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.feed.AtomFeedHttpMessageConverter;
import org.springframework.http.converter.feed.RssChannelHttpMessageConverter;
import org.springframework.http.converter.json.GsonHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.converter.support.AllEncompassingFormHttpMessageConverter;
import org.springframework.http.converter.xml.Jaxb2RootElementHttpMessageConverter;
import org.springframework.http.converter.xml.MappingJackson2XmlHttpMessageConverter;
import org.springframework.http.converter.xml.SourceHttpMessageConverter;
import org.springframework.util.ClassUtils;

import com.wavemaker.commons.CommonConstants;
import com.wavemaker.commons.WMRuntimeException;

/**
 * @author Uday Shankar
 */
public class WMRuntimeUtils {

    private WMRuntimeUtils(){}

    private static boolean romePresent =
            ClassUtils.isPresent("com.rometools.rome.feed.WireFeed", WMRuntimeUtils.class.getClassLoader());

    private static final boolean jaxb2Present =
            ClassUtils.isPresent("javax.xml.bind.Binder", WMRuntimeUtils.class.getClassLoader());

    private static final boolean jackson2Present =
            ClassUtils.isPresent("com.fasterxml.jackson.databind.ObjectMapper", WMRuntimeUtils.class.getClassLoader()) &&
                    ClassUtils.isPresent("com.fasterxml.jackson.core.JsonGenerator", WMRuntimeUtils.class.getClassLoader());

    private static final boolean jackson2XmlPresent =
            ClassUtils.isPresent("com.fasterxml.jackson.dataformat.xml.XmlMapper", WMRuntimeUtils.class.getClassLoader());

    private static final boolean gsonPresent =
            ClassUtils.isPresent("com.google.gson.Gson", WMRuntimeUtils.class.getClassLoader());

    private static final List<HttpMessageConverter<?>> messageConverters = new ArrayList<>();

    private static final String BYTE_ARRAY = "byte[]";

    private static final String BLOB = "Blob";


    static {
        messageConverters.add(new ByteArrayHttpMessageConverter());
        messageConverters.add(new StringHttpMessageConverter(Charset.forName(CommonConstants.UTF8)));
        messageConverters.add(new ResourceHttpMessageConverter());
        messageConverters.add(new SourceHttpMessageConverter<>());
        messageConverters.add(new AllEncompassingFormHttpMessageConverter());
        messageConverters.add(new FormHttpMessageConverter());
        if (romePresent) {
            messageConverters.add(new AtomFeedHttpMessageConverter());
            messageConverters.add(new RssChannelHttpMessageConverter());
        }
        if (jackson2XmlPresent) {
            messageConverters.add(new MappingJackson2XmlHttpMessageConverter());
        }
        if (jaxb2Present) {
            messageConverters.add(new Jaxb2RootElementHttpMessageConverter());
        }
        if (jackson2Present) {
            messageConverters.add(new MappingJackson2HttpMessageConverter());
        } else if (gsonPresent) {
            messageConverters.add(new GsonHttpMessageConverter());
        }
    }

    public static List<HttpMessageConverter<?>> getMessageConverters() {
        return messageConverters;
    }

    public static boolean isLob(Class instance, String field) {
        Field declaredField = null;
        try {
            declaredField = instance.getDeclaredField(field);
        } catch (NoSuchFieldException e) {
            throw new WMRuntimeException("Filed " + field + " does not exist in class " + instance.getName(), e);
        }
        if (declaredField != null && (BYTE_ARRAY.equals(declaredField.getType().getSimpleName()) || BLOB.equals(declaredField.getType().getSimpleName()))) {
            return true;
        }
        return false;
    }

    public static String getContextRelativePath(File file, HttpServletRequest request) {
      	return getContextRelativePath(file, request, null);
    }

    public static String getContextRelativePath(File file, HttpServletRequest request, String relativePath) {
        return getContextRelativePath(file, request, relativePath, false);
    }

    public static String getContextRelativePath(File file, HttpServletRequest request, String relativePath, boolean inline) {
        StringBuilder sb = new StringBuilder(request.getRequestURL());
        final int index = sb.lastIndexOf("/");
        if (index != -1) {
            sb.delete(index, sb.length());
        }
        sb.append(inline ? "/downloadFileAsInline" : "/downloadFile");
        sb.append("?file=").append(file.getName());
        if (StringUtils.isNotBlank(relativePath)) {
            sb.append("&relativePath=").append(relativePath);
        }
        sb.append("&returnName=").append(file.getName());
        return sb.toString();
    }
}
