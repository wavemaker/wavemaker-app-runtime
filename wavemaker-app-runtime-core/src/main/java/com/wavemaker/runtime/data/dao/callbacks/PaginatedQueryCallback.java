package com.wavemaker.runtime.data.dao.callbacks;

import java.util.List;
import java.util.Optional;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.query.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateCallback;

import com.wavemaker.runtime.data.dao.query.providers.PaginatedQueryProvider;
import com.wavemaker.runtime.data.dao.query.providers.ParametersProvider;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/8/17
 */
public class PaginatedQueryCallback<R> implements HibernateCallback<Page<R>> {

    private final PaginatedQueryProvider<R> queryProvider;
    private final ParametersProvider parametersProvider;
    private final Pageable pageable;

    public PaginatedQueryCallback(
            final PaginatedQueryProvider<R> queryProvider, final ParametersProvider parametersProvider,
            final Pageable pageable) {
        this.queryProvider = queryProvider;
        this.parametersProvider = parametersProvider;
        this.pageable = pageable;
    }

    @Override
    public Page<R> doInHibernate(final Session session) throws HibernateException {
        final Optional<Query<Number>> countQuery = queryProvider.getCountQuery(session, parametersProvider);
        long count = Integer.MAX_VALUE;
        if (countQuery.isPresent()) {
            final Optional<Number> countOptional = countQuery.get().uniqueResultOptional();
            if (countOptional.isPresent()) {
                count = countOptional.get().longValue();
            }
        }

        final Query<R> selectQuery = queryProvider.getQuery(session, pageable, parametersProvider);
        final List<R> result = selectQuery.list();

        return new PageImpl<>(result, pageable, count);
    }
}
