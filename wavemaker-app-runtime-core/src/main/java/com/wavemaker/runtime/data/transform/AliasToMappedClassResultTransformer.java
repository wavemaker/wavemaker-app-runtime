package com.wavemaker.runtime.data.transform;

import java.beans.PropertyDescriptor;
import java.lang.reflect.AccessibleObject;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.apache.commons.lang3.reflect.TypeUtils;
import org.hibernate.transform.AliasedTupleSubsetResultTransformer;
import org.springframework.beans.BeanUtils;

import com.google.common.base.Optional;
import com.wavemaker.runtime.data.annotations.ColumnAlias;
import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class AliasToMappedClassResultTransformer extends AliasedTupleSubsetResultTransformer implements
        WMResultTransformer {

    private final Class resultClass;

    private Map<String, PropertyDescriptor> aliasVsDescriptorMap;
    private Map<String, String> fieldVsAliasMap;

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
                descriptor.getWriteMethod().invoke(object, tuple[i]);
            }
            return object;
        } catch (InstantiationException | InvocationTargetException | IllegalAccessException e) {
            throw new WMRuntimeException("Error while converting result set to required type:" + resultClass, e);
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
