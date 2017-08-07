package com.wavemaker.runtime.data.dao.callbacks;

import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.query.Query;
import org.springframework.orm.hibernate5.HibernateCallback;

import com.wavemaker.runtime.data.dao.query.providers.ParametersProvider;
import com.wavemaker.runtime.data.dao.query.providers.QueryProvider;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/8/17
 */
public class UpdateQueryCallback implements HibernateCallback<Integer> {
    private final QueryProvider<Integer> queryProvider;
    private final ParametersProvider parametersProvider;

    public UpdateQueryCallback(
            final QueryProvider<Integer> queryProvider, final ParametersProvider parametersProvider) {
        this.queryProvider = queryProvider;
        this.parametersProvider = parametersProvider;
    }

    @Override
    public Integer doInHibernate(final Session session) throws HibernateException {
        final Query<Integer> query = queryProvider.getQuery(session, parametersProvider);
        return query.executeUpdate();
    }
}
