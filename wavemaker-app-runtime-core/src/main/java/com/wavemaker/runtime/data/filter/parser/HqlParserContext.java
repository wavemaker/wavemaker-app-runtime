package com.wavemaker.runtime.data.filter.parser;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * @author Sujith Simon
 * Created on : 6/11/18
 */
public class HqlParserContext {
    private StringBuilder queryBuilder;
    private Map<String, Object> parameters;
    private HqlFilterPropertyResolver hqlFilterPropertyResolver;

    public HqlParserContext(HqlFilterPropertyResolver hqlFilterPropertyResolver) {
        queryBuilder = new StringBuilder();
        parameters = new LinkedHashMap<>();
        this.hqlFilterPropertyResolver = hqlFilterPropertyResolver;
    }

    public void appendQuery(String query) {
        if (queryBuilder.length() != 0) {
            queryBuilder.append(" ");
        }
        queryBuilder.append(query);
    }

    public StringBuilder getQueryBuilder() {
        return queryBuilder;
    }

    public void setQueryBuilder(StringBuilder queryBuilder) {
        this.queryBuilder = queryBuilder;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public HqlFilterPropertyResolver getHqlFilterPropertyResolver() {
        return hqlFilterPropertyResolver;
    }

    public void setHqlFilterPropertyResolver(HqlFilterPropertyResolver hqlFilterPropertyResolver) {
        this.hqlFilterPropertyResolver = hqlFilterPropertyResolver;
    }
}
