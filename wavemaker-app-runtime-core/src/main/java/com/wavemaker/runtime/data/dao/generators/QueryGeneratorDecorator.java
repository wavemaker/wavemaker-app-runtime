package com.wavemaker.runtime.data.dao.generators;

import java.util.Map;

import com.wavemaker.runtime.data.model.AggregationInfo;
import com.wavemaker.runtime.data.util.HqlQueryBuilder;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/11/17
 */
public class QueryGeneratorDecorator<Entity, Identifier> implements EntityQueryGenerator<Entity, Identifier> {

    private final EntityQueryGenerator<Entity, Identifier> delegate;

    public QueryGeneratorDecorator(final EntityQueryGenerator<Entity, Identifier> delegate) {
        this.delegate = delegate;
    }

    @Override
    public HqlQueryBuilder findById(final Identifier identifier) {
        return delegate.findById(identifier);
    }

    @Override
    public HqlQueryBuilder findBy(final Map<String, Object> fieldValueMap) {
        return delegate.findBy(fieldValueMap);
    }

    @Override
    public HqlQueryBuilder searchByQuery(final String query) {
        return delegate.searchByQuery(query);
    }

    @Override
    public HqlQueryBuilder getAggregatedValues(final AggregationInfo aggregationInfo) {
        return delegate.getAggregatedValues(aggregationInfo);
    }
}
