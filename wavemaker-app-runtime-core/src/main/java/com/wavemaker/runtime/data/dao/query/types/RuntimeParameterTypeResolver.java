package com.wavemaker.runtime.data.dao.query.types;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.hibernate.Session;
import org.hibernate.TypeHelper;
import org.hibernate.type.Type;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.dao.query.types.wmql.WMQLTypeHelper;
import com.wavemaker.runtime.data.filter.WMQueryParamInfo;
import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.runtime.data.model.queries.QueryParameter;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 21/7/17
 */
public class RuntimeParameterTypeResolver implements ParameterTypeResolver {

    private final Map<String, Type> typesMap;

    public RuntimeParameterTypeResolver(List<QueryParameter> parameters, TypeHelper typeHelper) {
        typesMap = parameters.stream()
                .collect(Collectors.toMap(QueryParameter::getName,
                        queryParameter -> typeHelper.heuristicType(queryParameter.getType().getClassName())));
    }

    public RuntimeParameterTypeResolver(Map<String, WMQueryParamInfo> parameters, TypeHelper typeHelper) {
        typesMap = new HashMap<>();
        for (Map.Entry<String, WMQueryParamInfo> queryParamInfoEntry : parameters.entrySet()) {
            String key = queryParamInfoEntry.getKey();
            JavaType javaType = queryParamInfoEntry.getValue().getJavaType();

            if (javaType != null) {
                javaType = getDBSpecificJavaType(javaType);
                typesMap.put(key, typeHelper.heuristicType(javaType.getClassName()));
            }

        }
    }

    public static RuntimeParameterTypeResolver from(Session session, RuntimeQuery query) {
        return new RuntimeParameterTypeResolver(query.getParameters(), session.getSessionFactory().getTypeHelper());
    }

    private JavaType getDBSpecificJavaType(JavaType javaType) {
        WMQLTypeHelper typeHelper = WMAppContext.getInstance().getSpringBean(WMQLTypeHelper.class);

        if (typeHelper != null) {
            javaType = typeHelper.aliasFor(javaType);
        }
        return javaType;
    }

    @Override
    public Optional<Type> resolveType(final String name) {
        return Optional.ofNullable(typesMap.get(name));
    }
}
