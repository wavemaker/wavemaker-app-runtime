package com.wavemaker.runtime.converters;

import org.springframework.http.converter.HttpMessageConverter;

/**
 * @Author: sowmyad
 */
public interface WMCustomHttpMessageConverter<T> extends HttpMessageConverter<T> {

    boolean supportsClazz(Class<T> klass);
}
