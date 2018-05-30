package com.wavemaker.runtime.data.util;

import java.beans.PropertyDescriptor;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.util.Optional;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 8/5/18
 */
public class PropertyDescription {

    private final Field field;
    private final PropertyDescriptor descriptor;

    public PropertyDescription(final Field field, final PropertyDescriptor descriptor) {
        this.field = field;
        this.descriptor = descriptor;
    }

    public Field getField() {
        return field;
    }

    public PropertyDescriptor getDescriptor() {
        return descriptor;
    }

    public boolean isAnnotationNotPresent(Class<? extends Annotation> annotation) {
        return !isAnnotationPresent(annotation);
    }

    public boolean isAnnotationPresent(Class<? extends Annotation> annotation) {
        return findAnnotation(annotation).isPresent();
    }

    public <T extends Annotation> Optional<T> findAnnotation(Class<T> annotation) {
        Optional<T> result = Optional.empty();

        if (field.isAnnotationPresent(annotation)) {
            result = Optional.of(field.getAnnotation(annotation));
        } else if (descriptor.getReadMethod().isAnnotationPresent(annotation)) {
            result = Optional.of(descriptor.getReadMethod().getAnnotation(annotation));
        } else if (descriptor.getWriteMethod().isAnnotationPresent(annotation)) {
            result = Optional.of(descriptor.getWriteMethod().getAnnotation(annotation));
        }

        return result;
    }
}
