package com.wavemaker.runtime.data.dao.generators;

import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;

import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 30/11/17
 */
public class CompositeIdentifierStrategy<Entity, Identifier> implements IdentifierStrategy<Entity, Identifier> {

    private List<PropertyDescriptor> idProperties;

    public CompositeIdentifierStrategy(Class<Identifier> idClass) {
        idProperties = Arrays.stream(idClass.getDeclaredFields())
                .map(field -> BeanUtils.getPropertyDescriptor(idClass, field.getName()))
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> extract(final Identifier identifier) {
        Map<String, Object> valuesMap = new HashMap<>();

        idProperties.forEach(idProperty -> {
            try {
                idProperty.getReadMethod().invoke(identifier);
            } catch (IllegalAccessException | InvocationTargetException e) {
                throw new WMRuntimeException("unable to get identifier property:" + idProperty.getName(), e);
            }
        });

        return valuesMap;
    }
}
