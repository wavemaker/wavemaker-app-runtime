package com.wavemaker.runtime.data.dao.query.providers;

import org.hibernate.Session;
import org.hibernate.query.Query;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 1/8/17
 */
public interface QueryProvider<R> {

    Query<R> getQuery(Session session);

    default Query<R> getQuery(Session session, ParametersProvider provider) {
        return provider.configure(session, getQuery(session));
    }
}
