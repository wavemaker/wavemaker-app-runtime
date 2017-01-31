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
package com.wavemaker.runtime.json.type.reflect.converters;

import java.io.File;
import java.io.IOException;
import java.io.Writer;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.json.type.converters.WriteObjectConverter;
import com.wavemaker.runtime.json.type.reflect.ReflectTypeUtils;
import com.wavemaker.runtime.json.JSONMarshaller;
import com.wavemaker.runtime.json.type.converters.ReadObjectConverter;
import com.wavemaker.runtime.json.type.reflect.PrimitiveReflectTypeDefinition;

/**
 * TypeDefinition for {@link File} objects. This includes type conversion, and will serialize File objects to and from
 * String types.
 * 
 * @author Matt Small
 */
public class FileTypeDefinition extends PrimitiveReflectTypeDefinition implements ReadObjectConverter, WriteObjectConverter {

    public FileTypeDefinition(Class<? extends File> klass) {
        super();
        this.setKlass(klass);
        this.setTypeName(ReflectTypeUtils.getTypeName(this.getKlass()));
    }

    @Override
    public Object readObject(Object input, Object root, String path) {

        if (input == null) {
            return null;
        } else if (String.class.isAssignableFrom(input.getClass())) {
            return new File((String) input);
        } else {
            return input;
        }
    }

    @Override
    public void writeObject(Object input, Object root, String path, Writer writer) throws IOException {

        if (input == null) {
            JSONMarshaller.marshal(writer, input);
        } else if (input instanceof File) {
            String abspath = ((File) input).getAbsolutePath();
            JSONMarshaller.marshal(writer, abspath);
        } else {
            throw new WMRuntimeException(MessageResource.JSON_UNHANDLED_TYPE, input, input.getClass());
        }
    }
}