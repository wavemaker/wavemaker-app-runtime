package com.wavemaker.runtime.data.dao.util;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

import org.hibernate.query.Query;
import org.hibernate.type.Type;

import com.wavemaker.commons.util.Tuple;
import com.wavemaker.runtime.data.dao.query.types.HqlParameterTypeResolver;
import com.wavemaker.runtime.data.dao.query.types.ParameterTypeResolver;
import com.wavemaker.runtime.data.replacers.providers.VariableType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 21/7/17
 */
// TODO Redundant class, remove
public class ParametersConfigurator {

    public static <R> Query<R> configure(Query<R> query, Map<String, Object> parameters) {
        return configure(query, parameters, new HqlParameterTypeResolver());
    }

    public static <R> Query<R> configure(
            Query<R> query, Map<String, Object> parameters, ParameterTypeResolver resolver) {
        query.getParameterMetadata().getNamedParameterNames().forEach(parameterName -> {
            final Object value = getValue(parameters, parameterName);
            final Optional<Type> typeOptional = resolver.resolveType(parameterName);

            boolean listType = Collection.class.isInstance(value);

            if (typeOptional.isPresent()) {
                if (listType) {
                    query.setParameterList(parameterName, (Collection) value, typeOptional.get());
                } else {
                    query.setParameter(parameterName, value, typeOptional.get());
                }
            } else {
                if (listType) {
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
            final Tuple.Two<VariableType, String> variableInfo = VariableType.fromVariableName(parameterName);
            if (variableInfo.v1.isVariable()) {
                value = variableInfo.v1.getValue(variableInfo.v2);
            }
        }
        return value;
    }


}
