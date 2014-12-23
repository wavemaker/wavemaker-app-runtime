package com.wavemaker.runtime.util;

import java.lang.reflect.Field;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;

import javax.xml.transform.Source;

import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.ResourceHttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.feed.AtomFeedHttpMessageConverter;
import org.springframework.http.converter.feed.RssChannelHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.converter.support.AllEncompassingFormHttpMessageConverter;
import org.springframework.http.converter.xml.Jaxb2RootElementHttpMessageConverter;
import org.springframework.http.converter.xml.SourceHttpMessageConverter;
import org.springframework.util.ClassUtils;

import com.wavemaker.common.CommonConstants;
import com.wavemaker.common.WMRuntimeException;

/**
 * @author Uday Shankar
 */
public class WMRuntimeUtils {

    private static boolean romePresent =
            ClassUtils.isPresent("com.sun.syndication.feed.WireFeed", WMRuntimeUtils.class.getClassLoader());

    private static final boolean jaxb2Present =
            ClassUtils.isPresent("javax.xml.bind.Binder", WMRuntimeUtils.class.getClassLoader());

    private static final boolean jackson2Present =
            ClassUtils.isPresent("com.fasterxml.jackson.databind.ObjectMapper", WMRuntimeUtils.class.getClassLoader()) &&
                    ClassUtils.isPresent("com.fasterxml.jackson.core.JsonGenerator", WMRuntimeUtils.class.getClassLoader());

    private static final boolean jacksonPresent =
            ClassUtils.isPresent("org.codehaus.jackson.map.ObjectMapper", WMRuntimeUtils.class.getClassLoader()) &&
                    ClassUtils.isPresent("org.codehaus.jackson.JsonGenerator", WMRuntimeUtils.class.getClassLoader());

    private static final List<HttpMessageConverter<?>> messageConverters = new ArrayList<>();

    private static final String BYTE_ARRAY = "byte[]";

    static {
        messageConverters.add(new ByteArrayHttpMessageConverter());
        messageConverters.add(new StringHttpMessageConverter(Charset.forName(CommonConstants.UTF8)));
        messageConverters.add(new ResourceHttpMessageConverter());
        messageConverters.add(new SourceHttpMessageConverter<Source>());
        messageConverters.add(new AllEncompassingFormHttpMessageConverter());
        if (romePresent) {
            messageConverters.add(new AtomFeedHttpMessageConverter());
            messageConverters.add(new RssChannelHttpMessageConverter());
        }
        if (jaxb2Present) {
            messageConverters.add(new Jaxb2RootElementHttpMessageConverter());
        }
        if (jackson2Present) {
            messageConverters.add(new MappingJackson2HttpMessageConverter());
        }
        else if (jacksonPresent) {
            messageConverters.add(new org.springframework.http.converter.json.MappingJacksonHttpMessageConverter());
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
            throw new WMRuntimeException("Filed "+ field + " does not exist in class " + instance.getName(), e);
        }
        if (declaredField != null && BYTE_ARRAY.equals(declaredField.getType().getSimpleName())) {
            return true;
        }
        return false;
    }
}
