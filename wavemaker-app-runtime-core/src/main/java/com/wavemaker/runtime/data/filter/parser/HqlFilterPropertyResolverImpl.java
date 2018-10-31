package com.wavemaker.runtime.data.filter.parser;

import java.lang.reflect.Field;
import java.util.Optional;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.runtime.data.dao.validators.HqlPropertyResolver;
import com.wavemaker.runtime.data.exception.HqlGrammarException;
import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.runtime.data.util.JavaTypeUtils;

/**
 * @author Sujith Simon
 * Created on : 1/11/18
 */
public class HqlFilterPropertyResolverImpl implements HqlFilterPropertyResolver {

    private Class<?> entity;

    public HqlFilterPropertyResolverImpl(Class<?> entity) {
        this.entity = entity;
    }

    @Override
    public JavaType resolveProperty(String propertyKey) {
        Optional<Field> optionalField = HqlPropertyResolver.findField(propertyKey, entity);
        if (!optionalField.isPresent()) {
            throw new HqlGrammarException(MessageResource.create("Property {0} in the class {1} is not valid.")
                    , propertyKey, entity.getName());
        }
        Field field = optionalField.get();

        JavaType javaType = JavaTypeUtils.fromClassName(field.getType().getName()).orElse(null);
        if (javaType == null) {
            throw new HqlGrammarException(MessageResource.create("The property {0} in the entity {1} is not a comparable data type.")
                    , propertyKey, entity.getName());
        }
        return javaType;
    }


}
