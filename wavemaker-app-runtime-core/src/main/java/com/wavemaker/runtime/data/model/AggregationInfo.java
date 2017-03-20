package com.wavemaker.runtime.data.model;

import java.util.List;
import java.util.Objects;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/3/17
 */
public class AggregationInfo {

    private List<String> groupByFields;
    private List<Aggregation> aggregations;
    private String filter;

    public List<String> getGroupByFields() {
        return groupByFields;
    }

    public void setGroupByFields(final List<String> groupByFields) {
        this.groupByFields = groupByFields;
    }

    public List<Aggregation> getAggregations() {
        return aggregations;
    }

    public void setAggregations(final List<Aggregation> aggregations) {
        this.aggregations = aggregations;
    }

    public String getFilter() {
        return filter;
    }

    public void setFilter(final String filter) {
        this.filter = filter;
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (!(o instanceof AggregationInfo)) return false;
        final AggregationInfo that = (AggregationInfo) o;
        return Objects.equals(getGroupByFields(), that.getGroupByFields()) &&
                Objects.equals(getAggregations(), that.getAggregations()) &&
                Objects.equals(getFilter(), that.getFilter());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getGroupByFields(), getAggregations(), getFilter());
    }

    @Override
    public String toString() {
        return "AggregationInfo{" +
                "groupByFields=" + groupByFields +
                ", aggregations=" + aggregations +
                ", filter='" + filter + '\'' +
                '}';
    }
}
