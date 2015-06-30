package com.wavemaker.runtime.converters;

import org.springframework.http.MediaType;
import org.springframework.http.converter.AbstractHttpMessageConverter;
import java.io.IOException;

/**
 * @Author: Uday
 */
public abstract class WMCustomAbstractHttpMessageConverter<T> extends AbstractHttpMessageConverter<T> implements WMCustomHttpMessageConverter<T> {

    protected WMCustomAbstractHttpMessageConverter(MediaType... supportedMediaTypes) {
        super(supportedMediaTypes);
    }

    @Override
    public boolean supportsClazz(Class klass) {
        return supports(klass);
    }

    @Override
    protected MediaType getDefaultContentType(T t) throws IOException {
          return null;
    }
}
