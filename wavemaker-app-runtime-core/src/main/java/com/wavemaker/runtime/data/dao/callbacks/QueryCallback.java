package com.wavemaker.runtime.data.dao.callbacks;

import java.util.Optional;

import org.hibernate.Session;
import org.hibernate.query.Query;
import org.springframework.orm.hibernate5.HibernateCallback;

import com.wavemaker.runtime.data.dao.query.providers.ParametersProvider;
import com.wavemaker.runtime.data.dao.query.providers.QueryProvider;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/8/17
 */
public class QueryCallback<R> implements HibernateCallback<Optional<R>> {

    private final QueryProvider<R> queryProvider;
    private final ParametersProvider parametersProvider;

    public QueryCallback(
            final QueryProvider<R> queryProvider,
            final ParametersProvider parametersProvider) {
        this.queryProvider = queryProvider;
        this.parametersProvider = parametersProvider;
    }

    @Override
    public Optional<R> doInHibernate(final Session session) {
        final Query<R> query = queryProvider.getQuery(session, parametersProvider);
        return query.uniqueResultOptional();
    }
}
