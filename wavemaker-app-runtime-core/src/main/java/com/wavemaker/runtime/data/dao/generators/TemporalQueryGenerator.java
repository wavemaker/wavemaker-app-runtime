package com.wavemaker.runtime.data.dao.generators;

import java.sql.Timestamp;
import java.util.Map;

import com.wavemaker.runtime.data.annotations.TableTemporal;
import com.wavemaker.runtime.data.model.AggregationInfo;
import com.wavemaker.runtime.data.periods.AsOfClause;
import com.wavemaker.runtime.data.util.HqlQueryBuilder;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 30/11/17
 */
public class TemporalQueryGenerator<Entity, Identifier> extends QueryGeneratorDecorator<Entity, Identifier> {

    private final TableTemporal.TemporalType type;

    public TemporalQueryGenerator(
            final EntityQueryGenerator<Entity, Identifier> delegate,
            final TableTemporal.TemporalType type) {
        super(delegate);
        this.type = type;
    }

    @Override
    public HqlQueryBuilder findById(final Identifier identifier) {
        return super.findById(identifier)
                .withPeriodClause(new AsOfClause(type, new Timestamp(System.currentTimeMillis())));
    }

    @Override
    public HqlQueryBuilder findBy(
            final Map<String, Object> fieldValueMap) {
        return super.findBy(fieldValueMap)
                .withPeriodClause(new AsOfClause(type, new Timestamp(System.currentTimeMillis())));
    }

    @Override
    public HqlQueryBuilder searchByQuery(final String query) {
        return super.searchByQuery(query)
                .withPeriodClause(new AsOfClause(type, new Timestamp(System.currentTimeMillis())));
    }

    @Override
    public HqlQueryBuilder getAggregatedValues(
            final AggregationInfo aggregationInfo) {
        return super.getAggregatedValues(aggregationInfo)
                .withPeriodClause(new AsOfClause(type, new Timestamp(System.currentTimeMillis())));
    }
}
