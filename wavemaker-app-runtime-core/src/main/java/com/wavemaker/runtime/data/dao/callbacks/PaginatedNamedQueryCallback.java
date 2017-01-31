/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.dao.callbacks;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.HibernateException;
import org.hibernate.MappingException;
import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate4.HibernateCallback;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.model.PageableQueryInfo;
import com.wavemaker.runtime.data.spring.WMPageImpl;
import com.wavemaker.runtime.data.transform.Transformers;
import com.wavemaker.runtime.data.transform.WMResultTransformer;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class PaginatedNamedQueryCallback<T> implements HibernateCallback<Page<T>> {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaginatedNamedQueryCallback.class);

    private PageableQueryInfo<T> queryInfo;

    public PaginatedNamedQueryCallback(final PageableQueryInfo<T> queryInfo) {
        this.queryInfo = queryInfo;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Page<T> doInHibernate(final Session session) throws HibernateException {
        Query namedQuery = session.getNamedQuery(queryInfo.getQueryName());

        if (namedQuery instanceof SQLQuery) {
            namedQuery = createNewNativeQueryWithSorted(session, (SQLQuery) namedQuery);
        }

        QueryHelper.setResultTransformer(namedQuery, queryInfo.getReturnClass());
        QueryHelper.configureParameters(namedQuery, queryInfo.getParams());

        namedQuery.setFirstResult(queryInfo.getPageable().getOffset());
        namedQuery.setMaxResults(queryInfo.getPageable().getPageSize());

        return new WMPageImpl<T>((List<T>) namedQuery.list(), queryInfo.getPageable(), findCount(session));
    }

    private Query createNewNativeQueryWithSorted(Session session, SQLQuery query) {
        SQLQuery newQuery = query;
        if (queryInfo.getPageable().getSort() != null) {
            final String arrangeForSortQuery = QueryHelper
                    .arrangeForSort(query.getQueryString(), convertToNativeSort(), true,
                            ((SessionFactoryImplementor) session.getSessionFactory()).getDialect());
            newQuery = session.createSQLQuery(arrangeForSortQuery);
        }

        return newQuery;
    }

    private Sort convertToNativeSort() {
        final WMResultTransformer transformer = Transformers.aliasToMappedClass(queryInfo.getReturnClass());
        final Sort actualSort = queryInfo.getPageable().getSort();

        List<Sort.Order> nativeOrders = new ArrayList<>();
        for (final Sort.Order order : actualSort) {
            String property = order.getProperty();
            final String columnName = transformer.aliasFromFieldName(property);
            nativeOrders.add(new Sort.Order(order.getDirection(), columnName, order.getNullHandling()));
        }

        return new Sort(nativeOrders);
    }

    private long findCount(Session session) {
        try {
            final Query countQuery = session.getNamedQuery(queryInfo.getQueryName() + "__count");
            QueryHelper.configureParameters(countQuery, queryInfo.getParams());

            final Object result = countQuery.uniqueResult();
            return result == null ? 0 : ((Number) result).longValue();
        } catch (MappingException e) {
            LOGGER.debug("Count query not configured, returning max count, ERROR:{} ", e.getMessage());
            return Integer.MAX_VALUE;
        }
    }
}
