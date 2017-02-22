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

import java.beans.PropertyDescriptor;
import java.lang.reflect.AccessibleObject;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.apache.commons.lang3.reflect.TypeUtils;
import org.hibernate.transform.AliasedTupleSubsetResultTransformer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.google.common.base.Optional;
import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.annotations.ColumnAlias;
import com.wavemaker.runtime.data.exception.TypeMappingException;
import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class AliasToMappedClassResultTransformer extends AliasedTupleSubsetResultTransformer implements
        WMResultTransformer {

    private static final Logger LOGGER = LoggerFactory.getLogger(AliasToMappedClassResultTransformer.class);

    private static MultiValueMap<String, JavaType> classNameVsJavaTypeMap = new LinkedMultiValueMap<>();
    private static Set<String> ignorableAliases = new HashSet<>();

    private final Class resultClass;
    private Map<String, PropertyDescriptor> aliasVsDescriptorMap;

    private Map<String, String> fieldVsAliasMap;

    static {
        classNameVsJavaTypeMap.add(JavaType.BYTE.getClassName(), JavaType.BYTE);
        classNameVsJavaTypeMap.add(JavaType.SHORT.getClassName(), JavaType.SHORT);
        classNameVsJavaTypeMap.add(JavaType.INTEGER.getClassName(), JavaType.INTEGER);
        classNameVsJavaTypeMap.add(JavaType.LONG.getClassName(), JavaType.LONG);
        classNameVsJavaTypeMap.add(JavaType.BIG_INTEGER.getClassName(), JavaType.BIG_INTEGER);
        classNameVsJavaTypeMap.add(JavaType.FLOAT.getClassName(), JavaType.FLOAT);
        classNameVsJavaTypeMap.add(JavaType.DOUBLE.getClassName(), JavaType.DOUBLE);
        classNameVsJavaTypeMap.add(JavaType.BIG_DECIMAL.getClassName(), JavaType.BIG_DECIMAL);
        classNameVsJavaTypeMap.add(JavaType.BOOLEAN.getClassName(), JavaType.BOOLEAN);
        classNameVsJavaTypeMap.add(JavaType.YES_OR_NO.getClassName(), JavaType.YES_OR_NO);
        classNameVsJavaTypeMap.add(JavaType.TRUE_OR_FALSE.getClassName(), JavaType.TRUE_OR_FALSE);
        classNameVsJavaTypeMap.add(JavaType.CHARACTER.getClassName(), JavaType.CHARACTER);
        classNameVsJavaTypeMap.add(JavaType.STRING.getClassName(), JavaType.STRING);
        classNameVsJavaTypeMap.add(JavaType.TEXT.getClassName(), JavaType.TEXT);
        classNameVsJavaTypeMap.add(JavaType.CLOB.getClassName(), JavaType.CLOB);
        classNameVsJavaTypeMap.add(JavaType.BLOB.getClassName(), JavaType.BLOB);
        classNameVsJavaTypeMap.add(JavaType.DATE.getClassName(), JavaType.DATE);
        classNameVsJavaTypeMap.add(JavaType.TIME.getClassName(), JavaType.TIME);
        classNameVsJavaTypeMap.add(JavaType.DATETIME.getClassName(), JavaType.DATETIME);
        classNameVsJavaTypeMap.add(JavaType.TIMESTAMP.getClassName(), JavaType.TIMESTAMP);
        classNameVsJavaTypeMap.add(JavaType.CURSOR.getClassName(), JavaType.CURSOR);

        ignorableAliases.add("__hibernate_row_nr__");
    }

    public AliasToMappedClassResultTransformer(final Class resultClass) {
        Objects.requireNonNull(resultClass, "Result Class cannot be null");
        this.resultClass = resultClass;

        initialize();//xxx lazy load?
    }

    @Override
    public Object transformTuple(final Object[] tuple, final String[] aliases) {
        try {
            Object object = resultClass.newInstance();
            for (int i = 0; i < aliases.length; i++) {
                applyValue(object, aliases[i], tuple[i]);
            }
            return object;
        } catch (InstantiationException | IllegalAccessException e) {
            throw new WMRuntimeException("Cannot instantiate class:" + resultClass, e);
        }
    }

    @Override
    public boolean isTransformedValueATupleElement(final String[] aliases, final int tupleLength) {
        return false;
    }

    @Override
    public Object transformFromMap(final Map<String, Object> resultMap) {
        try {
            Object object = resultClass.newInstance();
            for (final Map.Entry<String, Object> entry : resultMap.entrySet()) {
                applyValue(object, entry.getKey(), entry.getValue());
            }
            return object;
        } catch (InstantiationException | IllegalAccessException e) {
            throw new WMRuntimeException("Cannot instantiate class:" + resultClass.getName(), e);
        }
    }

    @Override
    public String aliasToFieldName(final String columnName) {
        String fieldName = columnName;
        if (aliasVsDescriptorMap.containsKey(columnName)) {
            fieldName = aliasVsDescriptorMap.get(columnName).getName();
        }
        return fieldName;
    }

    @Override
    public String aliasFromFieldName(final String fieldName) {
        String alias = fieldName;

        if (fieldVsAliasMap.containsKey(alias)) {
            alias = fieldVsAliasMap.get(alias);
        }

        return alias;
    }

    private void applyValue(
            Object object, String alias, Object value) {
        if (aliasVsDescriptorMap.containsKey(alias)) {
            final PropertyDescriptor descriptor = aliasVsDescriptorMap.get(alias);
            Object transformedValue = transformField(descriptor, value);
            try {
                descriptor.getWriteMethod().invoke(object, transformedValue);
            } catch (IllegalAccessException | InvocationTargetException e) {
                throw new TypeMappingException(MessageResource.TYPE_MAPPING_FAILURE, e, alias, object.getClass()
                        .getName());
            }
        } else {
            if (!ignorableAliases.contains(alias)) {
                LOGGER.warn("Column: {} not found in type:{}, ignoring", alias, resultClass.getName());
            }
        }
    }

    @SuppressWarnings("unchecked")
    private Object transformField(final PropertyDescriptor descriptor, final Object value) {
        Object transformedValue = value;
        if (value != null) {
            if (value instanceof List) {
                transformedValue = new ArrayList<>();
                final Type innerType = ((ParameterizedType) descriptor.getReadMethod().getGenericReturnType())
                        .getActualTypeArguments()[0];

                final WMResultTransformer childTransformer = Transformers
                        .aliasToMappedClass(TypeUtils.getRawType(innerType, null));
                for (final Map<String, Object> val : ((List<Map<String, Object>>) value)) {
                    ((List) transformedValue).add(childTransformer.transformFromMap(val));
                }
            } else {
                final String className = descriptor.getPropertyType().getName();
                if (classNameVsJavaTypeMap.containsKey(className)) {
                    for (final JavaType javaType : classNameVsJavaTypeMap.get(className)) {
                        transformedValue = javaType.fromDbValue(value);
                    }
                }
            }
        }

        return transformedValue;
    }

    private void initialize() {
        final Field[] fields = resultClass.getDeclaredFields();
        aliasVsDescriptorMap = new HashMap<>();
        fieldVsAliasMap = new HashMap<>();
        for (final Field field : fields) {
            final PropertyDescriptor descriptor = BeanUtils.getPropertyDescriptor(resultClass, field.getName());
            Optional<String> columnName = findResultSetColumnName(field);
            if (!columnName.isPresent()) {
                columnName = findResultSetColumnName(descriptor.getReadMethod());
            }

            if (!columnName.isPresent()) {
                columnName = findResultSetColumnName(descriptor.getWriteMethod());
            }

            if (!columnName.isPresent()) {
                columnName = Optional.of(field.getName());
            }

            aliasVsDescriptorMap.put(columnName.get(), descriptor);
            fieldVsAliasMap.put(descriptor.getName(), columnName.get());
        }
    }

    private Optional<String> findResultSetColumnName(AccessibleObject member) {
        Optional<String> rsColumn = Optional.absent();
        final ColumnAlias annotation = member.getAnnotation(ColumnAlias.class);
        if (annotation != null) {
            rsColumn = Optional.of(annotation.value());
        }
        return rsColumn;
    }
}
