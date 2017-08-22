package com.wavemaker.runtime.data.dao.query.types;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.hibernate.engine.spi.NamedQueryDefinition;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.internal.TypeLocatorImpl;
import org.hibernate.query.spi.NamedQueryRepository;
import org.hibernate.type.Type;

import com.wavemaker.runtime.data.util.HibernateUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 21/7/17
 */
public class SessionBackedParameterResolver {

    private final SessionFactoryImplementor factory;

    private final Map<String, ParameterTypeResolver> resolversCache;

    public SessionBackedParameterResolver(final SessionFactoryImplementor factory) {
        this.factory = factory;

        resolversCache = new HashMap<>();
    }

    @SuppressWarnings("unchecked")
    public ParameterTypeResolver getResolver(String queryName) {
        return resolversCache.computeIfAbsent(queryName, name -> {
            Map<String, Type> typesMap = new HashMap<>();

            final NamedQueryRepository repository = factory.getNamedQueryRepository();

            NamedQueryDefinition definition = repository.getNamedQueryDefinition(name);

            if (definition == null) {
                definition = repository.getNamedSQLQueryDefinition(name);
            }

            final Map<String, String> parameterTypes = definition.getParameterTypes();

            if (parameterTypes != null) {
                final TypeLocatorImpl typeHelper = new TypeLocatorImpl(factory.getTypeResolver());
                parameterTypes.forEach((paramName, paramType) -> {
                    final Optional<Type> typeOptional = HibernateUtils.findType(typeHelper, paramType);
                    typeOptional.ifPresent(type -> typesMap.put(paramName, type));
                });
            }

            return parameterName -> Optional.ofNullable(typesMap.get(parameterName));
        });
    }


}
