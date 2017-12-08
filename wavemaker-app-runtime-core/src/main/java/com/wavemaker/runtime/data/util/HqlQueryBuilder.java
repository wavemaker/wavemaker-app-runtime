package com.wavemaker.runtime.data.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

import com.wavemaker.commons.util.Tuple;
import com.wavemaker.runtime.data.filter.LegacyQueryFilterInterceptor;
import com.wavemaker.runtime.data.filter.QueryInterceptor;
import com.wavemaker.runtime.data.filter.WMQueryFunctionInterceptor;
import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.model.Aggregation;
import com.wavemaker.runtime.data.model.AggregationInfo;
import com.wavemaker.runtime.data.periods.PeriodClause;

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

    private List<PeriodClause> periodClauses = new ArrayList<>(2);

    private Map<String, Object> filterConditions = new HashMap<>();
    private String filter;

    private List<Aggregation> aggregations;

    private final Class<?> entityClass;

    public HqlQueryBuilder(final Class<?> entityClass) {
        this.entityClass = entityClass;

    }

    public static HqlQueryBuilder newBuilder(Class<?> entityClass) {
        return new HqlQueryBuilder(entityClass);
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

    public HqlQueryBuilder withPeriodClauses(final List<PeriodClause> periodClauses) {
        this.periodClauses.addAll(periodClauses);
        return this;
    }

    public HqlQueryBuilder withPeriodClause(PeriodClause periodClause) {
        this.periodClauses.add(periodClause);
        return this;
    }

    public HqlQueryBuilder withFilterConditions(final Map<String, Object> filterConditions) {
        this.filterConditions.putAll(filterConditions);
        return this;
    }

    public HqlQueryBuilder withFilterCondition(String fieldName, Object value) {
        this.filterConditions.put(fieldName, value);
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

        builder.append(generateFromClause(parameters));
        builder.append(generateWhereClause(parameters));

        if (CollectionUtils.isNotEmpty(groupByFields)) {
            builder.append("group by ")
                    .append(StringUtils.join(groupByFields, ","))
                    .append(" ");
        }

        return new WMQueryInfo(builder.toString(), parameters);
    }

    public Optional<WMQueryInfo> buildCountQuery() {
        Optional<WMQueryInfo> result = Optional.empty();

        // hql doesn't support group by in combination of group by
        if (CollectionUtils.isEmpty(groupByFields)) {
            Map<String, Object> parameters = new HashMap<>();

            final String countQuery = "select count(*) " +
                    generateFromClause(parameters) +
                    generateWhereClause(parameters);

            result = Optional.of(new WMQueryInfo(countQuery, parameters));

        }

        return result;
    }

    private String generateFromClause(final Map<String, Object> parameters) {
        final StringBuilder builder = new StringBuilder();
        builder.append("from ")
                .append(entityClass.getCanonicalName())
                .append(" ");

        periodClauses.stream()
                .map(PeriodClause::asWMQueryClause)
                .forEach(queryInfo -> {
                    builder.append(queryInfo.getQuery()).append(" ");
                    parameters.putAll(queryInfo.getParameters());
                });
        return builder.toString();
    }

    private String generateWhereClause(final Map<String, Object> parameters) {
        final StringBuilder builder = new StringBuilder();

        if (!filterConditions.isEmpty() || StringUtils.isNotBlank(filter)) {
            builder.append("where ");

            builder.append(filterConditions.entrySet().stream()
                    .map(entry -> new Tuple.Two<>(entry, "wm_filter_" + entry.getKey()))
                    .peek(tuple -> parameters.put(tuple.v2, tuple.v1.getValue()))
                    .map(tuple -> tuple.v1.getKey() + " = :" + tuple.v2)
                    .collect(Collectors.joining(" and ", " ", " ")));

            if (StringUtils.isNotBlank(filter)) {
                final WMQueryInfo queryInfo = interceptFilter(filter);

                if (!filterConditions.isEmpty()) {
                    builder.append("and ");
                }
                builder.append(queryInfo.getQuery())
                        .append(" ");

                parameters.putAll(queryInfo.getParameters());
            }
        }

        return builder.toString();
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
