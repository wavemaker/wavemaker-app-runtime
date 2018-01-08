package com.wavemaker.runtime.data.dao.validators;

import java.lang.reflect.Field;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.ReflectionUtils;

import com.wavemaker.commons.InvalidInputException;
import com.wavemaker.commons.MessageResource;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/5/17
 */
public class SortValidator {


    public void validate(Pageable pageable, Class<?> entityClass) {
        if (pageable != null && pageable.getSort() != null) {
            final Sort sort = pageable.getSort();
            for (final Sort.Order order : sort) {
                final String propertyName = order.getProperty();
                checkPropertyName(propertyName, entityClass);
            }
        }
    }

    private void checkPropertyName(String propertyName, Class<?> entityClass) {
        String[] properties = propertyName.split("\\.");
        Class<?> aClass = entityClass;
        for (String property : properties) {
            Field field = ReflectionUtils.findField(aClass, property);
            if (field == null) {
                throw new InvalidInputException(MessageResource.UNKNOWN_FIELD_NAME, propertyName);
            }
            aClass = field.getType();
        }
    }
}