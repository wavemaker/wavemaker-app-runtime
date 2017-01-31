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
package com.wavemaker.runtime.data.converters;

import org.hibernate.type.descriptor.java.JavaTypeDescriptor;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public class HibernateBackedJavaTypeConverter implements JavaTypeConverter {

    private JavaTypeDescriptor descriptor;

    public HibernateBackedJavaTypeConverter(final JavaTypeDescriptor descriptor) {
        this.descriptor = descriptor;
    }

    @Override
    public Object fromString(final String value) {
        return descriptor.fromString(value);
    }

    @Override
    public Object fromDbValue(final Object value) {
        return descriptor.wrap(value, null);
    }

    @SuppressWarnings("unchecked")
    @Override
    public Object toDbValue(final Object value, Class<?> toType) {
        return descriptor.unwrap(value, toType, null);
    }
}
