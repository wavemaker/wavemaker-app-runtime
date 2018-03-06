package com.wavemaker.runtime.data.dao.callbacks;

import org.hibernate.Session;
import org.hibernate.query.Query;
import org.springframework.orm.hibernate5.HibernateCallback;

import com.wavemaker.runtime.data.dao.query.providers.ParametersProvider;
import com.wavemaker.runtime.data.dao.query.providers.QueryProvider;
import com.wavemaker.runtime.data.exception.EntityNotFoundException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/8/17
 */
public class QueryCallback<R> implements HibernateCallback<R> {

    private final QueryProvider<R> queryProvider;
    private final ParametersProvider parametersProvider;

    public QueryCallback(
            final QueryProvider<R> queryProvider,
            final ParametersProvider parametersProvider) {
        this.queryProvider = queryProvider;
        this.parametersProvider = parametersProvider;
    }

    @Override
    public R doInHibernate(final Session session) {
        final Query<R> query = queryProvider.getQuery(session, parametersProvider);
        return query.uniqueResultOptional()
                .orElseThrow(() -> new EntityNotFoundException("No row exists"));
    }
}
