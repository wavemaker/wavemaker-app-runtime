package com.wavemaker.runtime.data.hql;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import com.wavemaker.commons.util.Tuple;
import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.filter.WMQueryParamInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 8/5/18
 */
public class UpdateQueryBuilder extends QueryBuilder<UpdateQueryBuilder> {

    private Map<String, Object> setters = new HashMap<>();

    public UpdateQueryBuilder(final Class<?> entityClass, boolean hqlSanitize) {
        super(entityClass, hqlSanitize);
    }

    public UpdateQueryBuilder withSetter(String fieldName, Object value) {
        this.setters.put(fieldName, value);
        return this;
    }

    public WMQueryInfo build() {
        Map<String, WMQueryParamInfo> parameters = new HashMap<>();
        String query = "update " +
                generateFromClause(parameters, true) +
                generateSetClause(parameters) +
                generateWhereClause(parameters);

        return new WMQueryInfo(query, parameters);
    }

    private String generateSetClause(Map<String, WMQueryParamInfo> parameters) {
        return (setters.entrySet().stream()
                .map(entry -> new Tuple.Two<>(entry, "wm_setter_" + entry.getKey()))
                .peek(tuple -> parameters.put(tuple.v2, new WMQueryParamInfo(tuple.v1.getValue())))
                .map(tuple -> tuple.v1.getKey() + " = :" + tuple.v2)
                .collect(Collectors.joining(", ", " set ", " ")));
    }

}
