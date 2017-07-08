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
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.BeanUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public class EntityValueReplacerBuilder {


    public EntityValueReplacer build(Class<?> type) {
        MultiValueMap<Scope, FieldValueReplacer> overriderMultiValueMap = new LinkedMultiValueMap<>
                (Scope.values().length);

        for (final Scope phase : Scope.values()) {
            overriderMultiValueMap.put(phase, new ArrayList<>());
        }

        final Map<Field, PropertyDescriptor> fieldDescriptorMap = buildDescriptorMap(type);

        for (Map.Entry<Field, PropertyDescriptor> entry : fieldDescriptorMap.entrySet()) {
            final Annotation[] annotations = entry.getKey().getAnnotations();
            for (final Annotation annotation : annotations) {
                if (ValueProviderFactory.contains(annotation.annotationType())) {
                    final ValueProviderBuilder builder = ValueProviderFactory.getBuilder(annotation.annotationType());
                    final ValueProvider provider = builder.build(entry.getKey(), fieldDescriptorMap, annotation);
                    FieldValueReplacer fieldValueReplacer = new FieldValueReplacer(entry.getValue(), provider);
                    final Set<Scope> scopes = provider.scopes();
                    if (scopes.contains(Scope.INSERT)) {
                        overriderMultiValueMap.add(Scope.INSERT, fieldValueReplacer);
                    }
                    if (scopes.contains(Scope.UPDATE)) {
                        overriderMultiValueMap.add(Scope.UPDATE, fieldValueReplacer);
                    }
                    if (scopes.contains(Scope.DELETE)) {
                        overriderMultiValueMap.add(Scope.DELETE, fieldValueReplacer);
                    }
                    if (scopes.contains(Scope.READ)) {
                        overriderMultiValueMap.add(Scope.READ, fieldValueReplacer);
                    }
                }
            }
        }

        return new EntityValueReplacer(convert(fieldDescriptorMap), overriderMultiValueMap);
    }

    private Map<String, PropertyDescriptor> convert(Map<Field, PropertyDescriptor> fieldPropertyDescriptorMap) {
        Map<String, PropertyDescriptor> propertyDescriptorMap = new HashMap<>(fieldPropertyDescriptorMap.size());

        for (final Map.Entry<Field, PropertyDescriptor> entry : fieldPropertyDescriptorMap.entrySet()) {
            propertyDescriptorMap.put(entry.getKey().getName(), entry.getValue());
        }

        return propertyDescriptorMap;
    }

    private Map<Field, PropertyDescriptor> buildDescriptorMap(Class<?> type) {
        Map<Field, PropertyDescriptor> propertyDescriptorMap = new HashMap<>();
        for (final Field field : type.getDeclaredFields()) {
            final PropertyDescriptor descriptor = BeanUtils.getPropertyDescriptor(type, field.getName());
            propertyDescriptorMap.put(field, descriptor);
        }
        return propertyDescriptorMap;
    }
}
