package com.wavemaker.runtime.data.dao.query.providers;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.hibernate.Session;
import org.hibernate.type.Type;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.model.queries.QueryParameter;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 4/8/17
 */
public class RuntimeParametersProvider implements ParametersProvider {
    private final RuntimeQuery query;

    private final Map<String, QueryParameter> parameterMap;

    public RuntimeParametersProvider(final RuntimeQuery query) {
        this.query = query;
        parameterMap = query.getParameters().stream()
                .collect(Collectors.toMap(QueryParameter::getName, parameter -> parameter));
    }

    @Override
    public Object getValue(final Session session, final String name) {
        if (parameterMap.containsKey(name)) {
            return QueryHelper.prepareParam(parameterMap.get(name), query.isNativeSql());
        } else {
            return null;
        }
    }

    @Override
    public Optional<Type> getType(final Session session, final String name) {
        if (parameterMap.containsKey(name)) {
            final String className = parameterMap.get(name).getType().getClassName();
            return Optional.ofNullable(session.getTypeHelper().heuristicType(className));
        }

        return Optional.empty();
    }
}
