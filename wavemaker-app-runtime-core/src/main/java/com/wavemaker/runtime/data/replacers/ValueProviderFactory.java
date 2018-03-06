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

import java.lang.annotation.Annotation;
import java.util.HashMap;
import java.util.Map;

import com.wavemaker.runtime.data.annotations.Encrypted;
import com.wavemaker.runtime.data.annotations.WMValueInject;
import com.wavemaker.runtime.data.replacers.providers.EncryptedValueProviderBuilder;
import com.wavemaker.runtime.data.replacers.providers.VariableDefinedPropertyProvider;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public class ValueProviderFactory {

    private ValueProviderFactory(){}

    private static Map<Class<? extends Annotation>, ValueProviderBuilder> annotationValueProviderBuilderMap;

    static {
        annotationValueProviderBuilderMap = new HashMap<>();

        annotationValueProviderBuilderMap.put(Encrypted.class, new EncryptedValueProviderBuilder());
        annotationValueProviderBuilderMap.put(WMValueInject.class,
                new VariableDefinedPropertyProvider.VariableDefinedPropertyProviderBuilder());
    }


    public static ValueProviderBuilder getBuilder(Class<? extends Annotation> annotationType) {

        return annotationValueProviderBuilderMap.get(annotationType);
    }

    public static boolean contains(Class<? extends Annotation> type) {
        return annotationValueProviderBuilderMap.containsKey(type);
    }
}
