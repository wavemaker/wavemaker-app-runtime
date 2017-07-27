package com.wavemaker.runtime.data.dao.callbacks;

import java.util.Map;
import java.util.Optional;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.query.NativeQuery;
import org.hibernate.query.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.orm.hibernate5.HibernateCallback;

import com.wavemaker.runtime.data.dao.query.types.ParameterTypeResolver;
import com.wavemaker.runtime.data.dao.util.ParametersConfigurator;
import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.spring.WMPageImpl;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/3/17
 */
public abstract class AbstractPaginatedQueryCallback<T> implements HibernateCallback<Page<T>> {

    @Override
    public Page<T> doInHibernate(final Session session) throws HibernateException {
        Query<T> query = getQuery(session);

        final Class<?> responseType = getReturnType();
        if (getPageable() != null) {
            if (getPageable().getSort() != null) {
                final Sort sort = getPageable().getSort();
                if (query instanceof NativeQuery) {
                    query = QueryHelper.createNewNativeQueryWithSorted(session, (NativeQuery) query,
                            responseType, sort);
                } else {
                    query = QueryHelper.createNewHqlQueryWithSorted(session, query, responseType, sort);
                }
            }
            query.setFirstResult(getPageable().getOffset());
            query.setMaxResults(getPageable().getPageSize());
        }
        QueryHelper.setResultTransformer(query, responseType);
        ParametersConfigurator.configure(query, getParameters(), getParameterTypeResolver());

        return new WMPageImpl<>(query.list(), getPageable(), findCount(session));
    }

    private Long findCount(final Session session) {
        long count = Integer.MAX_VALUE;
        final Optional<Query> optionalQuery = getCountQuery(session);

        if (optionalQuery.isPresent()) {
            final Query query = optionalQuery.get();

            ParametersConfigurator.configure(query, getParameters(), getParameterTypeResolver());


            final Object result = query.uniqueResult();
            count = (result == null) ? 0 : ((Number) result).longValue();
        }

        return count;
    }

    protected abstract Query<T> getQuery(final Session session);

    protected abstract Optional<Query> getCountQuery(final Session session);

    protected abstract Map<String, Object> getParameters();

    protected abstract ParameterTypeResolver getParameterTypeResolver();

    protected abstract Pageable getPageable();

    protected abstract Class<?> getReturnType();
}
