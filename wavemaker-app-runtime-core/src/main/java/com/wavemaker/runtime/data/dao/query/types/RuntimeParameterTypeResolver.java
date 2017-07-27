package com.wavemaker.runtime.data.dao.query.types;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.hibernate.type.Type;
import org.hibernate.type.TypeResolver;

import com.wavemaker.runtime.data.model.queries.QueryParameter;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 21/7/17
 */
public class RuntimeParameterTypeResolver implements ParameterTypeResolver {

    private final Map<String, Type> typesMap;

    public RuntimeParameterTypeResolver(List<QueryParameter> parameters, TypeResolver resolver) {
        typesMap = parameters.stream()
                .collect(Collectors.toMap(QueryParameter::getName,
                        queryParameter -> resolver.heuristicType(queryParameter.getType().getClassName())));
    }


    @Override
    public Optional<Type> resolveType(final String name) {
        return Optional.ofNullable(typesMap.get(name));
    }
}
