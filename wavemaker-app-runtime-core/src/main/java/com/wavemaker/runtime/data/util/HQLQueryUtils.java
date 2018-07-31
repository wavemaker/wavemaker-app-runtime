/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.hibernate.Session;
import org.hibernate.query.Query;
import org.hibernate.type.AbstractStandardBasicType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateCallback;
import org.springframework.orm.hibernate5.HibernateTemplate;

import com.wavemaker.commons.util.Tuple;
import com.wavemaker.runtime.data.dao.util.ParametersConfigurator;
import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.filter.LegacyQueryFilterInterceptor;
import com.wavemaker.runtime.data.filter.QueryInterceptor;
import com.wavemaker.runtime.data.filter.WMQueryFunctionInterceptor;
import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.model.ReferenceType;
import com.wavemaker.runtime.data.model.returns.FieldType;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.spring.WMPageImpl;
import com.wavemaker.runtime.data.transform.WMResultTransformer;

public class HQLQueryUtils {

    private static final String FROM = " from ";
    private static final String WHERE = " where ";

    private static final List<QueryInterceptor> interceptors = Arrays.asList(
            new LegacyQueryFilterInterceptor(),
            new WMQueryFunctionInterceptor());

    public static Tuple.Two<Query, Map<String, Object>> createHQLQuery(
            String entityClass, String query, Pageable pageable, Session
            session) {
        final WMQueryInfo queryInfo = buildHQL(entityClass, query, pageable);

        Query hqlQuery = session.createQuery(queryInfo.getQuery());

        if (pageable != null) {
            hqlQuery.setFirstResult((int) pageable.getOffset());
            hqlQuery.setMaxResults(pageable.getPageSize());
        }
        return new Tuple.Two<>(hqlQuery, queryInfo.getParameters());
    }

    public static Page executeHQLQuery(
            final Query hqlQuery, final Map<String, Object> params, final Pageable pageable,
            final HibernateTemplate template) {

        return template.execute((HibernateCallback<Page<Object>>) session -> {
            QueryHelper.setResultTransformer(hqlQuery, Object.class);
            ParametersConfigurator.configure(hqlQuery, params);
            if (pageable != null) {
                Long count = QueryHelper.getQueryResultCount(hqlQuery.getQueryString(), params, false, template);
                return new WMPageImpl(hqlQuery.list(), pageable, count);
            }
            return new WMPageImpl(hqlQuery.list());
        });
    }

    public static List<ReturnProperty> extractMetaForHql(final Query query) {
        final org.hibernate.type.Type[] returnTypes = query.getReturnTypes();
        final String[] returnAliases = query.getReturnAliases();
        List<ReturnProperty> properties = new ArrayList<>(returnTypes.length);
        for (int i = 0; i < returnTypes.length; i++) {
            final org.hibernate.type.Type type = returnTypes[i];

            ReturnProperty property = new ReturnProperty();

            property.setName(WMResultTransformer.getAlias(returnAliases, i));

            FieldType fieldType = new FieldType();
            String typeRef = type.getName();
            if (type.isCollectionType()) {
                fieldType.setList(true);
            }
            if (type.isAssociationType()) {
                fieldType.setType(ReferenceType.ENTITY);
            } else {
                fieldType.setType(ReferenceType.PRIMITIVE);
            }
            if (type instanceof AbstractStandardBasicType) {
                final Class typeClass = ((AbstractStandardBasicType) type).getJavaTypeDescriptor().getJavaTypeClass();
                typeRef = typeClass.getCanonicalName();
            }

            fieldType.setTypeRef(typeRef);
            property.setFieldType(fieldType);

            if (i == 0 && (returnAliases == null || returnAliases.length == 1) && (fieldType.getType() == ReferenceType.ENTITY)) {
                // setting property name to for avoiding creating new model class
                // in case of query returning only entity.
                property.setName(null);
            }

            properties.add(property);
        }
        return properties;
    }


    private static WMQueryInfo buildHQL(String entityClass, String filter, Pageable pageable) {
        WMQueryInfo queryInfo = new WMQueryInfo(filter);

        String queryFilter = StringUtils.EMPTY;
        if (StringUtils.isNotBlank(queryInfo.getQuery())) {
            for (final QueryInterceptor interceptor : interceptors) {
                interceptor.intercept(queryInfo);
            }
            queryFilter = WHERE + queryInfo.getQuery();
        }

        String queryString = FROM + entityClass + queryFilter;

        if (pageable != null) {
            queryString = QueryHelper.applySortingForHqlQuery(queryString, pageable.getSort());
        }

        queryInfo.setQuery(queryString);

        return queryInfo;
    }
}
