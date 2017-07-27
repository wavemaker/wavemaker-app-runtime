package com.wavemaker.runtime.data.dao.util;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

import org.hibernate.query.Query;
import org.hibernate.type.Type;

import com.wavemaker.commons.util.Tuple;
import com.wavemaker.runtime.data.dao.query.types.ParameterTypeResolver;
import com.wavemaker.runtime.data.replacers.providers.VariableType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 21/7/17
 */
public class ParametersConfigurator {

    public static <R> Query<R> configureParameters(
            Query<R> query, ParameterTypeResolver resolver, Map<String, Object> parameters) {
        query.getParameterMetadata().getNamedParameterNames().forEach(parameterName -> {
            final Object value = getValue(parameters, parameterName);
            final Optional<Type> typeOptional = resolver.resolveType(parameterName);

            if (typeOptional.isPresent()) {
                if (value instanceof Collection) {
                    query.setParameterList(parameterName, (Collection) value, typeOptional.get());
                } else {
                    query.setParameter(parameterName, value, typeOptional.get());
                }
            } else {
                if (value instanceof Collection) {
                    query.setParameterList(parameterName, (Collection) value);
                } else {
                    query.setParameter(parameterName, value);
                }
            }
        });

        return query;
    }

    private static Object getValue(final Map<String, Object> parameters, final String parameterName) {
        Object value = parameters.get(parameterName);
        // looking for system variables, only for null values.
        if (value == null) {
            final Tuple.Two<VariableType, String> variableInfo = VariableType
                    .fromVariableName(parameterName);
            if (variableInfo.v1.isVariable()) {
                value = variableInfo.v1.getValue(variableInfo.v2);
            }
        }
        return value;
    }


}
