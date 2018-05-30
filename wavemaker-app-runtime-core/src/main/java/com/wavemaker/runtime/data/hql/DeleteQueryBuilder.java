package com.wavemaker.runtime.data.hql;

import java.util.HashMap;
import java.util.Map;

import com.wavemaker.runtime.data.filter.WMQueryInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 8/5/18
 */
public class DeleteQueryBuilder extends QueryBuilder<DeleteQueryBuilder> {
    public DeleteQueryBuilder(final Class<?> entityClass) {
        super(entityClass);
    }

    public WMQueryInfo build() {
        Map<String, Object> parameters = new HashMap<>();

        final String query = "delete " +
                generateFromClause(parameters, true) +
                generateWhereClause(parameters);

        return new WMQueryInfo(query, parameters);
    }
}
