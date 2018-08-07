package com.wavemaker.runtime.data.dao.generators;

import java.beans.PropertyDescriptor;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import javax.persistence.Id;

import com.wavemaker.runtime.data.util.AnnotationUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 30/11/17
 */
public class SingleIdentifierStrategy<Entity, Identifier> implements IdentifierStrategy<Entity, Identifier> {

    private final String idFieldName;

    public SingleIdentifierStrategy(Class<Entity> entityClass) {
        final List<PropertyDescriptor> idProperties = AnnotationUtils.findProperties(entityClass, Id.class);
        idFieldName = idProperties.get(0).getName();
    }

    @Override
    public Map<String, Object> extract(final Identifier identifier) {
        return Collections.singletonMap(idFieldName, identifier);
    }
}
