package com.wavemaker.runtime.data.dao.generators;

import java.util.Map;
import javax.persistence.IdClass;

import com.wavemaker.runtime.data.model.AggregationInfo;
import com.wavemaker.runtime.data.util.HqlQueryBuilder;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/11/17
 */
public class SimpleEntitiyQueryGenerator<Entity, Identifier> implements EntityQueryGenerator<Entity, Identifier> {

    private final Class<Entity> entityClass;

    private final IdentifierStrategy<Entity, Identifier> identifierStrategy;

    @SuppressWarnings("unchecked")
    public SimpleEntitiyQueryGenerator(final Class<Entity> entityClass) {
        this.entityClass = entityClass;

        if (entityClass.isAnnotationPresent(IdClass.class)) {
            final IdClass idClass = entityClass.getAnnotation(IdClass.class);
            identifierStrategy = new CompositeIdentifierStrategy<>((Class<Identifier>) idClass.value());
        } else {
            identifierStrategy = new SingleIdentifierStrategy<>(entityClass);
        }
    }

    @Override
    public HqlQueryBuilder findById(final Identifier identifier) {
        HqlQueryBuilder builder = HqlQueryBuilder.newBuilder(entityClass);

        builder.withFilterConditions(identifierStrategy.extract(identifier));

        return builder;
    }

    @Override
    public HqlQueryBuilder findBy(final Map<String, Object> fieldValueMap) {
        return HqlQueryBuilder.newBuilder(entityClass)
                .withFilterConditions(fieldValueMap);
    }

    @Override
    public HqlQueryBuilder searchByQuery(final String query) {
        return HqlQueryBuilder.newBuilder(entityClass)
                .withFilter(query);
    }

    @Override
    public HqlQueryBuilder getAggregatedValues(final AggregationInfo aggregationInfo) {
        return HqlQueryBuilder.newBuilder(entityClass)
                .withAggregationInfo(aggregationInfo);
    }
}
