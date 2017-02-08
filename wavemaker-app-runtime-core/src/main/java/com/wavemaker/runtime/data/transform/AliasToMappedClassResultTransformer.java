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
package com.wavemaker.runtime.data.transform;

import java.beans.PropertyDescriptor;
import java.lang.reflect.AccessibleObject;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.apache.commons.collections.map.MultiValueMap;
import org.apache.commons.lang3.reflect.TypeUtils;
import org.hibernate.transform.AliasedTupleSubsetResultTransformer;
import org.springframework.beans.BeanUtils;

import com.google.common.base.Optional;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.annotations.ColumnAlias;
import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class AliasToMappedClassResultTransformer extends AliasedTupleSubsetResultTransformer implements
        WMResultTransformer {

    private final Class resultClass;

    private Map<String, PropertyDescriptor> aliasVsDescriptorMap;
    private Map<String, String> fieldVsAliasMap;

    private static MultiValueMap classNameVsJavaTypeMap = new MultiValueMap();

    static {
        classNameVsJavaTypeMap.put(JavaType.BYTE.getClassName(), JavaType.BYTE);
        classNameVsJavaTypeMap.put(JavaType.SHORT.getClassName(), JavaType.SHORT);
        classNameVsJavaTypeMap.put(JavaType.INTEGER.getClassName(), JavaType.INTEGER);
        classNameVsJavaTypeMap.put(JavaType.LONG.getClassName(), JavaType.LONG);
        classNameVsJavaTypeMap.put(JavaType.BIG_INTEGER.getClassName(), JavaType.BIG_INTEGER);
        classNameVsJavaTypeMap.put(JavaType.FLOAT.getClassName(), JavaType.FLOAT);
        classNameVsJavaTypeMap.put(JavaType.DOUBLE.getClassName(), JavaType.DOUBLE);
        classNameVsJavaTypeMap.put(JavaType.BIG_DECIMAL.getClassName(), JavaType.BIG_DECIMAL);
        classNameVsJavaTypeMap.put(JavaType.BOOLEAN.getClassName(), JavaType.BOOLEAN);
        classNameVsJavaTypeMap.put(JavaType.YES_OR_NO.getClassName(), JavaType.YES_OR_NO);
        classNameVsJavaTypeMap.put(JavaType.TRUE_OR_FALSE.getClassName(), JavaType.TRUE_OR_FALSE);
        classNameVsJavaTypeMap.put(JavaType.CHARACTER.getClassName(), JavaType.CHARACTER);
        classNameVsJavaTypeMap.put(JavaType.STRING.getClassName(), JavaType.STRING);
        classNameVsJavaTypeMap.put(JavaType.TEXT.getClassName(), JavaType.TEXT);
        classNameVsJavaTypeMap.put(JavaType.CLOB.getClassName(), JavaType.CLOB);
        classNameVsJavaTypeMap.put(JavaType.BLOB.getClassName(), JavaType.BLOB);
        classNameVsJavaTypeMap.put(JavaType.DATE.getClassName(), JavaType.DATE);
        classNameVsJavaTypeMap.put(JavaType.TIME.getClassName(), JavaType.TIME);
        classNameVsJavaTypeMap.put(JavaType.DATETIME.getClassName(), JavaType.DATETIME);
        classNameVsJavaTypeMap.put(JavaType.TIMESTAMP.getClassName(), JavaType.TIMESTAMP);
        classNameVsJavaTypeMap.put(JavaType.CURSOR.getClassName(), JavaType.CURSOR);
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
                final String alias = aliases[i];

                final PropertyDescriptor descriptor = aliasVsDescriptorMap.get(alias);
                Object transformedValue = transformValue(tuple[i], descriptor);
                descriptor.getWriteMethod().invoke(object, transformedValue);
            }
            return object;
        } catch (InstantiationException | InvocationTargetException | IllegalAccessException e) {
            throw new WMRuntimeException("Error while converting result set to required type:" + resultClass, e);
        }
    }

    private Object transformValue(final Object value, final PropertyDescriptor descriptor) {
        final Object dbValue = value;
        Object transformedValue = null;
        if(dbValue != null) {
            if (dbValue instanceof List) {
                transformedValue = transformField(descriptor, dbValue);
            } else {
                final String className = descriptor.getPropertyType().getName();
                final Collection values = classNameVsJavaTypeMap.getCollection(className);
                if(values != null) {
                    for (final Object javaTypeObject : values) {
                        if(transformedValue == null) {
                            JavaType javaType = ((JavaType) javaTypeObject);
                            transformedValue = javaType.fromDbValue(dbValue);
                        } else {
                            break;
                        }
                    }
                } else {
                    transformedValue = dbValue;
                }
            }
        }
        return transformedValue;
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
                final PropertyDescriptor descriptor = aliasVsDescriptorMap.get(entry.getKey());

                descriptor.getWriteMethod().invoke(object, transformField(descriptor, entry.getValue()));
            }
            return object;
        } catch (InstantiationException | InvocationTargetException | IllegalAccessException e) {
            throw new WMRuntimeException("Error while converting result set to required type:" + resultClass, e);
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

    @SuppressWarnings("unchecked")
    private Object transformField(final PropertyDescriptor descriptor, final Object value) {
        Object transformedValue = value;
        if (value != null && value instanceof List) {
            transformedValue = new ArrayList<>();
            final Type innerType = ((ParameterizedType) descriptor.getReadMethod().getGenericReturnType())
                    .getActualTypeArguments()[0];

            final WMResultTransformer childTransformer = Transformers
                    .aliasToMappedClass(TypeUtils.getRawType(innerType, null));
            for (final Map<String, Object> val : ((List<Map<String, Object>>) value)) {
                ((List) transformedValue).add(childTransformer.transformFromMap(val));
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
            rsColumn = Optional.fromNullable(annotation.value());
        }
        return rsColumn;
    }
}
