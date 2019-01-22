package com.wavemaker.runtime.data.dao.generators;

import java.util.Map;

import javax.persistence.IdClass;

import com.wavemaker.runtime.data.hql.SelectQueryBuilder;
import com.wavemaker.runtime.data.model.AggregationInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/11/17
 */
public class SimpleEntitiyQueryGenerator<E, I> implements EntityQueryGenerator<E, I> {

    private final Class<E> entityClass;

    private final IdentifierStrategy<E, I> identifierStrategy;
    private final boolean hqlSanitize;

    @SuppressWarnings("unchecked")
    public SimpleEntitiyQueryGenerator(final Class<E> entityClass, boolean hqlSanitize) {
        this.entityClass = entityClass;
        this.hqlSanitize = hqlSanitize;


        if (entityClass.isAnnotationPresent(IdClass.class)) {
            final IdClass idClass = entityClass.getAnnotation(IdClass.class);
            identifierStrategy = new CompositeIdentifierStrategy<>((Class<I>) idClass.value());
        } else {
            identifierStrategy = new SingleIdentifierStrategy<>(entityClass);
        }
    }

    @Override
    public SelectQueryBuilder findById(final I identifier) {
        SelectQueryBuilder builder = SelectQueryBuilder.newBuilder(entityClass, hqlSanitize);

        builder.withFilterConditions(identifierStrategy.extract(identifier));

        return builder;
    }

    @Override
    public SelectQueryBuilder findBy(final Map<String, Object> fieldValueMap) {
        return SelectQueryBuilder.newBuilder(entityClass, hqlSanitize)
                .withFilterConditions(fieldValueMap);
    }

    @Override
    public SelectQueryBuilder searchByQuery(final String query) {
        return SelectQueryBuilder.newBuilder(entityClass, hqlSanitize)
                .withFilter(query);
    }

    @Override
    public SelectQueryBuilder getAggregatedValues(final AggregationInfo aggregationInfo) {
        return SelectQueryBuilder.newBuilder(entityClass, hqlSanitize)
                .withAggregationInfo(aggregationInfo);
    }
}
