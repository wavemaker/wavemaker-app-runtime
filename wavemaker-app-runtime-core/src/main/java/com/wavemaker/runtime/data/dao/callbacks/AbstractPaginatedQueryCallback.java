package com.wavemaker.runtime.data.dao.callbacks;

import java.util.List;
import java.util.Map;

import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate4.HibernateCallback;

import com.google.common.base.Optional;
import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.spring.WMPageImpl;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/3/17
 */
public abstract class AbstractPaginatedQueryCallback<T> implements HibernateCallback<Page<T>> {

    @Override
    @SuppressWarnings("unchecked")
    public Page<T> doInHibernate(final Session session) throws HibernateException {
        Query query = getQuery(session);

        final Class<?> responseType = getReturnType();
        if (getPageable() != null) {
            if (getPageable().getSort() != null) {
                final Sort sort = getPageable().getSort();
                if (query instanceof SQLQuery) {
                    query = QueryHelper.createNewNativeQueryWithSorted(session, (SQLQuery) query,
                            responseType, sort);
                } else {
                    query = QueryHelper.createNewHqlQueryWithSorted(session, query, responseType, sort);
                }
            }
            query.setFirstResult(getPageable().getOffset());
            query.setMaxResults(getPageable().getPageSize());
        }
        QueryHelper.setResultTransformer(query, responseType);
        QueryHelper.configureParameters(query, getParameters());

        return new WMPageImpl<>((List<T>) query.list(), getPageable(), findCount(session));
    }

    private Long findCount(final Session session) {
        long count = Integer.MAX_VALUE;
        final Optional<Query> optionalQuery = getCountQuery(session);

        if (optionalQuery.isPresent()) {
            final Query query = optionalQuery.get();

            QueryHelper.configureParameters(query, getParameters());

            final Object result = query.uniqueResult();
            count = (result == null) ? 0 : ((Number) result).longValue();
        }

        return count;
    }

    protected abstract Query getQuery(final Session session);

    protected abstract Optional<Query> getCountQuery(final Session session);

    protected abstract Map<String, Object> getParameters();

    protected abstract Pageable getPageable();

    protected abstract Class<?> getReturnType();
}
