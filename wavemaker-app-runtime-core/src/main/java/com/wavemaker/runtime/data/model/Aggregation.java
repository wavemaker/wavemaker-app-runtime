package com.wavemaker.runtime.data.model;

import java.util.Objects;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/3/17
 */
public class Aggregation {
    private String field;
    private AggregationType type;
    private String alias;

    public Aggregation() {
    }

    public Aggregation(final String field, final AggregationType type, final String alias) {
        this.field = field;
        this.type = type;
        this.alias = alias;
    }

    public String getField() {
        return field;
    }

    public void setField(final String field) {
        this.field = field;
    }

    public AggregationType getType() {
        return type;
    }

    public void setType(final AggregationType type) {
        this.type = type;
    }

    public String getAlias() {
        return alias;
    }

    public void setAlias(final String alias) {
        this.alias = alias;
    }

    public String asSelection() {
        return type.name() + "(" + field + ") as " + alias;
    }

    @Override
    public String toString() {
        return "Aggregation{" +
                "field='" + field + '\'' +
                ", type=" + type +
                ", alias='" + alias + '\'' +
                '}';
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (!(o instanceof Aggregation)) return false;
        final Aggregation that = (Aggregation) o;
        return Objects.equals(getField(), that.getField()) &&
                Objects.equals(getType(), that.getType()) &&
                Objects.equals(getAlias(), that.getAlias());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getField(), getType(), getAlias());
    }
}
