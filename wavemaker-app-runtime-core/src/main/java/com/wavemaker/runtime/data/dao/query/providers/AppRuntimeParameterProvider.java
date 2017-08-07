package com.wavemaker.runtime.data.dao.query.providers;

import java.util.Map;
import java.util.Optional;

import org.hibernate.Session;
import org.hibernate.type.Type;

import com.wavemaker.commons.util.Tuple;
import com.wavemaker.runtime.data.dao.query.types.ParameterTypeResolver;
import com.wavemaker.runtime.data.replacers.providers.VariableType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 4/8/17
 */
public class AppRuntimeParameterProvider implements ParametersProvider {

    private final Map<String, Object> parameters;
    private final ParameterTypeResolver resolver;

    public AppRuntimeParameterProvider(final Map<String, Object> parameters, final ParameterTypeResolver resolver) {
        this.parameters = parameters;
        this.resolver = resolver;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Object getValue(final Session session, final String name) {
        Object value = parameters.get(name);
        // looking for system variables, only for null values.
        if (value == null) {
            final Tuple.Two<VariableType, String> variableInfo = VariableType.fromVariableName(name);
            if (variableInfo.v1.isVariable()) {
                final Optional<Type> type = getType(session, name);
                if (type.isPresent()) {
                    value = variableInfo.v1.getValue(variableInfo.v2, type.get().getReturnedClass());
                } else {
                    value = variableInfo.v1.getValue(variableInfo.v2);
                }
            }
        }
        return value;
    }

    @Override
    public Optional<Type> getType(final Session session, final String name) {
        return resolver.resolveType(name);
    }
}
