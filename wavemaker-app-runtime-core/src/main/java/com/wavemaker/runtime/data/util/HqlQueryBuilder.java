package com.wavemaker.runtime.data.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Pageable;

import com.wavemaker.runtime.data.filter.LegacyQueryFilterInterceptor;
import com.wavemaker.runtime.data.filter.QueryInterceptor;
import com.wavemaker.runtime.data.filter.WMQueryFunctionInterceptor;
import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.model.Aggregation;
import com.wavemaker.runtime.data.model.AggregationInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/3/17
 */
public class HqlQueryBuilder {

    private static final List<QueryInterceptor> interceptors = Arrays.asList(
            new LegacyQueryFilterInterceptor(),
            new WMQueryFunctionInterceptor());

    private List<String> fields;
    private String distinctField;
    private List<String> groupByFields;

    private List<Aggregation> aggregations;

    private String filter;
    private Pageable pageable;

    private final Class<?> entityClass;

    public HqlQueryBuilder(final Class<?> entityClass) {
        this.entityClass = entityClass;

    }

    public HqlQueryBuilder withFields(final List<String> fields) {
        this.fields = fields;
        return this;
    }

    public HqlQueryBuilder withDistinctFields(final String distinctField) {
        this.distinctField = distinctField;
        return this;
    }

    public HqlQueryBuilder withGroupByFields(final List<String> groupByFields) {
        this.groupByFields = groupByFields;
        return this;
    }

    public HqlQueryBuilder withAggregations(final List<Aggregation> aggregations) {
        this.aggregations = aggregations;
        return this;
    }

    public HqlQueryBuilder withFilter(final String filter) {
        this.filter = filter;
        return this;
    }

    public HqlQueryBuilder withPageable(final Pageable pageable) {
        this.pageable = pageable;
        return this;
    }

    public HqlQueryBuilder withAggregationInfo(AggregationInfo aggregationInfo) {
        withGroupByFields(aggregationInfo.getGroupByFields())
                .withAggregations(aggregationInfo.getAggregations())
                .withFilter(aggregationInfo.getFilter());
        return this;
    }

    public WMQueryInfo build() {
        StringBuilder builder = new StringBuilder();
        Map<String, Object> parameters = new HashMap<>();

        final String projections = generateProjections();

        if (StringUtils.isNotBlank(projections)) {
            builder.append("select ")
                    .append(projections)
                    .append(" ");
        }

        builder.append("from ")
                .append(entityClass.getCanonicalName())
                .append(" ");

        if (StringUtils.isNotBlank(filter)) {
            final WMQueryInfo queryInfo = interceptFilter(filter);
            builder.append("where ")
                    .append(queryInfo.getQuery())
                    .append(" ");
            parameters = queryInfo.getParameters();
        }

        if (CollectionUtils.isNotEmpty(groupByFields)) {
            builder.append("group by ")
                    .append(StringUtils.join(groupByFields, ","))
                    .append(" ");
        }

      /*  if (HQLQueryUtils.isSortAppliedOnPageable(pageable)) {
            builder.append(HQLQueryUtils.buildOrderByClause(pageable.getSort()));
        }*/
/*
        Query hqlQuery = session.createQuery(builder.toString());

        if (pageable != null) {
            hqlQuery.setFirstResult(pageable.getOffset());
            hqlQuery.setMaxResults(pageable.getPageSize());
        }

        return new HqlQueryHolder(hqlQuery, parameters);*/

        return new WMQueryInfo(builder.toString(), parameters);
    }

    private String generateProjections() {
        List<String> projections = new ArrayList<>();

        if (StringUtils.isNotEmpty(distinctField)) {
            projections.add("distinct(" + distinctField + ") as " + cleanAlias(distinctField));
        }

        if (CollectionUtils.isNotEmpty(fields)) {
            projections.addAll(fields);
        }

        if (CollectionUtils.isNotEmpty(groupByFields)) {
            for (final String field : groupByFields) {
                projections.add(field + " as " + cleanAlias(field));
            }
        }

        if (CollectionUtils.isNotEmpty(aggregations)) {
            for (final Aggregation aggregation : aggregations) {
                projections.add(aggregation.asSelection());
            }
        }

        return StringUtils.join(projections, ",");
    }

    private String cleanAlias(String alias) {
        return alias.replaceAll("\\.", "\\$");
    }

    private WMQueryInfo interceptFilter(String filter) {
        WMQueryInfo queryInfo = new WMQueryInfo(filter);

        for (final QueryInterceptor interceptor : interceptors) {
            interceptor.intercept(queryInfo);
        }

        return queryInfo;
    }
}
