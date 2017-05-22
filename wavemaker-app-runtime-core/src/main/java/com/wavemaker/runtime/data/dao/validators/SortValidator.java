package com.wavemaker.runtime.data.dao.validators;

import java.lang.reflect.Field;
import java.util.HashSet;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.wavemaker.commons.InvalidInputException;
import com.wavemaker.commons.MessageResource;
import com.wavemaker.runtime.data.util.JavaTypeUtils;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/5/17
 */
public class SortValidator {

    private static final int MAX_CHILDREN_LEVEL = 3;

    private Class<?> entityClass;
    private Set<String> fieldNames;

    public SortValidator(Class<?> entityClass) {
        this.entityClass = entityClass;
    }

    public void validate(Pageable pageable) {
        if (pageable != null && pageable.getSort() != null) {
            if (fieldNames == null) {
                this.fieldNames = buildFieldNameList(entityClass, "", 0);
            }
            final Sort sort = pageable.getSort();
            for (final Sort.Order order : sort) {
                final String propertyName = order.getProperty();
                if (!fieldNames.contains(propertyName)) {
                    throw new InvalidInputException(MessageResource.UNKNOWN_FIELD_NAME, propertyName);
                }
            }
        }
    }

    private Set<String> buildFieldNameList(Class<?> entityClass, String prefix, int currentLevel) {
        Set<String> names = new HashSet<>();
        for (final Field field : entityClass.getDeclaredFields()) {
            String fieldName = field.getName();
            if (StringUtils.isNotBlank(prefix)) {
                fieldName = prefix + '.' + fieldName;
            }
            final Class<?> fieldType = field.getType();
            if (JavaTypeUtils.isKnownType(fieldType)) {
                names.add(fieldName);
            } else if (currentLevel < MAX_CHILDREN_LEVEL && JavaTypeUtils.isNotCollectionType(fieldType)) {
                names.addAll(buildFieldNameList(fieldType, fieldName, ++currentLevel));
            }
        }
        return names;
    }
}