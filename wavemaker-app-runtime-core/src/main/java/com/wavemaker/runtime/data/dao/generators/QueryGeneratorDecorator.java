package com.wavemaker.runtime.data.dao.generators;

import java.util.Map;

import com.wavemaker.runtime.data.hql.SelectQueryBuilder;
import com.wavemaker.runtime.data.model.AggregationInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/11/17
 */
public class QueryGeneratorDecorator<E, I> implements EntityQueryGenerator<E, I> {

    private final EntityQueryGenerator<E, I> delegate;

    public QueryGeneratorDecorator(final EntityQueryGenerator<E, I> delegate) {
        this.delegate = delegate;
    }

    @Override
    public SelectQueryBuilder findById(final I identifier) {
        return delegate.findById(identifier);
    }

    @Override
    public SelectQueryBuilder findBy(final Map<String, Object> fieldValueMap) {
        return delegate.findBy(fieldValueMap);
    }

    @Override
    public SelectQueryBuilder searchByQuery(final String query) {
        return delegate.searchByQuery(query);
    }

    @Override
    public SelectQueryBuilder getAggregatedValues(final AggregationInfo aggregationInfo) {
        return delegate.getAggregatedValues(aggregationInfo);
    }
}
