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
package com.wavemaker.runtime.data.transform;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.apache.commons.lang3.ClassUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class Transformers {

    private final Map<Class<?>, WMResultTransformer> transformerMap;

    private Transformers() {
        transformerMap = new HashMap<>();

        transformerMap.put(Object.class, AliasToEntityLinkedHashMapTransformer.INSTANCE);
        transformerMap.put(Map.class, AliasToEntityLinkedHashMapTransformer.INSTANCE);
        transformerMap.put(Void.class, new VoidTransformer());
    }

    private static class TransformersHolder {
        private static final Transformers INSTANCE = new Transformers();
    }

    public WMResultTransformer get(Class<?> type) {
        if (!transformerMap.containsKey(type)) {
            synchronized (transformerMap) {
                if (!transformerMap.containsKey(type)) {
                    transformerMap.put(type, new AliasToMappedClassResultTransformer(type));
                }
            }
        }
        return transformerMap.get(type);
    }

    public static WMResultTransformer aliasToMappedClass(Class<?> type) {
        return TransformersHolder.INSTANCE.get(type);
    }

    public static Optional<WMResultTransformer> aliasToMappedClassOptional(Class<?> type) {
        if (ClassUtils.isPrimitiveOrWrapper(type) || Number.class.isAssignableFrom(type)) {
            return Optional.empty();
        } else {
            return Optional.ofNullable(aliasToMappedClass(type));
        }
    }

}
