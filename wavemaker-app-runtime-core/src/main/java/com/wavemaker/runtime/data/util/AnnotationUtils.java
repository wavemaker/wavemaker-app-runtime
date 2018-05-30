package com.wavemaker.runtime.data.util;

import java.beans.PropertyDescriptor;
import java.lang.annotation.Annotation;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;

import com.wavemaker.commons.util.Tuple;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 30/11/17
 */
public interface AnnotationUtils {

    static List<PropertyDescriptor> findProperties(Class<?> type, Class<? extends Annotation> annotationType) {
        return Arrays.stream(type.getDeclaredFields())
                .map(field -> new Tuple.Two<>(field, BeanUtils.getPropertyDescriptor(type, field.getName())))
                .filter(tuple -> {
                    boolean found = tuple.v1.isAnnotationPresent(annotationType);

                    found = found || tuple.v2.getReadMethod().isAnnotationPresent(annotationType);
                    found = found || tuple.v2.getWriteMethod().isAnnotationPresent(annotationType);

                    return found;
                }).map(tuple -> tuple.v2)
                .collect(Collectors.toList());
    }

    static List<PropertyDescription> findProperties(Class<?> type) {
        return Arrays.stream(type.getDeclaredFields())
                .map(field -> new PropertyDescription(field, BeanUtils.getPropertyDescriptor(type, field.getName())))
                .collect(Collectors.toList());
    }
}
