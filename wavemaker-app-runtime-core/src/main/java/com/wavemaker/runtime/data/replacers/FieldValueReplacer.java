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
package com.wavemaker.runtime.data.replacers;

import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;

import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public class FieldValueReplacer {

    private final PropertyDescriptor descriptor;
    private final ValueProvider provider;


    public FieldValueReplacer(final PropertyDescriptor descriptor, final ValueProvider provider) {
        this.descriptor = descriptor;
        this.provider = provider;
    }

    public void apply(ListenerContext context) {
        try {
            descriptor.getWriteMethod().invoke(context.getEntity(), provider.getValue(context));
        } catch (IllegalAccessException | InvocationTargetException e) {
            throw new WMRuntimeException("Error while overriding property value", e);
        }
    }

}
