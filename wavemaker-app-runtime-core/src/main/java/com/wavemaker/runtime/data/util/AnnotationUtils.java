package com.wavemaker.runtime.data.util;

import java.beans.PropertyDescriptor;
import java.lang.annotation.Annotation;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;

import com.wavemaker.commons.util.Tuple;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 30/11/17
 */
public abstract class AnnotationUtils {

    private static final Logger LOGGER = LoggerFactory.getLogger(AnnotationUtils.class);

    public static List<PropertyDescriptor> findProperties(Class<?> type, Class<? extends Annotation> annotationType) {
        return Arrays.stream(type.getDeclaredFields())
                .map(field -> new Tuple.Two<>(field, BeanUtils.getPropertyDescriptor(type, field.getName())))
                .filter(tuple -> {
                    boolean found = tuple.v1.isAnnotationPresent(annotationType);

                    if (tuple.v2 != null) {
                        if (tuple.v2.getReadMethod() != null) {
                            found = found || tuple.v2.getReadMethod().isAnnotationPresent(annotationType);
                        } else {
                            LOGGER.warn("Read method not found for field: {} in class: {}", tuple.v1.getName(),
                                    type.getName());
                        }

                        if (tuple.v2.getWriteMethod() != null) {
                            found = found || tuple.v2.getWriteMethod().isAnnotationPresent(annotationType);
                        } else {
                            LOGGER.warn("Write method not found for field: {} in class: {}", tuple.v1.getName(),
                                    type.getName());
                        }
                    } else {
                        LOGGER.warn("Property Descriptor not found for field: {} in class: {}", tuple.v1.getName(),
                                type.getName());
                    }

                    return found;
                }).map(tuple -> tuple.v2)
                .collect(Collectors.toList());
    }

    public static List<PropertyDescription> findProperties(Class<?> type) {
        return Arrays.stream(type.getDeclaredFields())
                .map(field -> new PropertyDescription(field, BeanUtils.getPropertyDescriptor(type, field.getName())))
                .collect(Collectors.toList());
    }
}
