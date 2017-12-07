package com.wavemaker.runtime.data.dao.generators;

import java.util.Map;

import com.wavemaker.runtime.data.model.AggregationInfo;
import com.wavemaker.runtime.data.util.HqlQueryBuilder;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/11/17
 */
public interface EntityQueryGenerator<Entity, Identifier> {

    HqlQueryBuilder findById(final Identifier identifier);

    HqlQueryBuilder findBy(final Map<String, Object> fieldValueMap);

    HqlQueryBuilder searchByQuery(final String query);

    HqlQueryBuilder getAggregatedValues(final AggregationInfo aggregationInfo);
}
