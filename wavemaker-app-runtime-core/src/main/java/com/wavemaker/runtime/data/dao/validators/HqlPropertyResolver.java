package com.wavemaker.runtime.data.dao.validators;

import java.lang.reflect.Field;
import java.util.Optional;

import org.springframework.util.ReflectionUtils;

/**
 * @author Sujith Simon
 * Created on : 6/11/18
 */
public interface HqlPropertyResolver {

    static Optional<Field> findField(String propertyName, Class<?> entityClass) {
        String[] properties = propertyName.split("\\.");
        Class<?> aClass = entityClass;
        Field resultField = null;

        for (String property : properties) {
            Field field = ReflectionUtils.findField(aClass, property);
            if (field == null) {
                return Optional.empty();
            }
            aClass = field.getType();
            resultField = field;

        }
        return Optional.ofNullable(resultField);
    }
}
