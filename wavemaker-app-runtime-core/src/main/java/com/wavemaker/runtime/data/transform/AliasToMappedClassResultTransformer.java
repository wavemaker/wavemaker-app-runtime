package com.wavemaker.runtime.data.transform;

import java.beans.PropertyDescriptor;
import java.lang.reflect.AccessibleObject;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import org.hibernate.transform.AliasedTupleSubsetResultTransformer;
import org.springframework.beans.BeanUtils;

import com.google.common.base.Optional;
import com.wavemaker.runtime.data.annotations.ColumnAlias;
import com.wavemaker.studio.common.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class AliasToMappedClassResultTransformer extends AliasedTupleSubsetResultTransformer {

    private final Class resultClass;

    private Map<String, PropertyDescriptor> aliasVsDescriptorMap;

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

    private void initialize() {
        final Field[] fields = resultClass.getDeclaredFields();
        aliasVsDescriptorMap = new HashMap<>();
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
