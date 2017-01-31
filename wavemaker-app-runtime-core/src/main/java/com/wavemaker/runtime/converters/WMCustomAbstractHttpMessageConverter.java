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
