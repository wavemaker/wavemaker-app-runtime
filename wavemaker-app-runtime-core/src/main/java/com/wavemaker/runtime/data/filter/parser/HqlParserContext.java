package com.wavemaker.runtime.data.filter.parser;

import java.util.LinkedHashMap;
import java.util.Map;

import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.filter.WMQueryParamInfo;
import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author Sujith Simon
 * Created on : 6/11/18
 */
public class HqlParserContext {
    private StringBuilder queryBuilder;
    private Map<String, WMQueryParamInfo> parameters;
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

    public Map<String, WMQueryParamInfo> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, WMQueryParamInfo> parameters) {
        this.parameters = parameters;
    }

    public HqlFilterPropertyResolver getHqlFilterPropertyResolver() {
        return hqlFilterPropertyResolver;
    }

    public void setHqlFilterPropertyResolver(HqlFilterPropertyResolver hqlFilterPropertyResolver) {
        this.hqlFilterPropertyResolver = hqlFilterPropertyResolver;
    }

    public void addParameter(String key, String value, JavaType type) {
        parameters.put(key, new WMQueryParamInfo(value, type));
    }

    public WMQueryInfo toWMQueryInfo() {
        return new WMQueryInfo(queryBuilder.toString(), parameters);
    }
}
