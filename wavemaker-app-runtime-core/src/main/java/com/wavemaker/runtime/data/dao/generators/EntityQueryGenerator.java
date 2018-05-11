package com.wavemaker.runtime.data.dao.generators;

import java.util.Map;

import com.wavemaker.runtime.data.hql.SelectQueryBuilder;
import com.wavemaker.runtime.data.model.AggregationInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/11/17
 */
public interface EntityQueryGenerator<E, I> {

    SelectQueryBuilder findById(final I identifier);

    SelectQueryBuilder findBy(final Map<String, Object> fieldValueMap);

    SelectQueryBuilder searchByQuery(final String query);

    SelectQueryBuilder getAggregatedValues(final AggregationInfo aggregationInfo);
}
