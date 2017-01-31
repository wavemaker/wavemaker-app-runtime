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
package com.wavemaker.runtime.data.interceptors;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.wavemaker.runtime.data.replacers.EntityValueReplacer;
import com.wavemaker.runtime.data.replacers.EntityValueReplacerBuilder;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 22/6/16
 */
public class InterceptorContext {

    private Map<Class<?>, EntityValueReplacer> typeVsValueOverrider;

    public InterceptorContext() {
        this.typeVsValueOverrider = new ConcurrentHashMap<>();
    }

    public EntityValueReplacer getEntityValueOverrider(Class<?> type) {
        if (!typeVsValueOverrider.containsKey(type)) {
            synchronized (type.getName().intern()) {
                if (!typeVsValueOverrider.containsKey(type)) {
                    EntityValueReplacerBuilder builder = new EntityValueReplacerBuilder();
                    typeVsValueOverrider.put(type, builder.build(type));
                }
            }
        }
        return typeVsValueOverrider.get(type);
    }
}
