package com.wavemaker.runtime.data.dao.query.providers;

import org.hibernate.Session;
import org.hibernate.query.Query;
import org.springframework.data.domain.Pageable;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 1/8/17
 */
public interface PaginatedQueryProvider<R> {

    /**
     * Returns or creates query from underlying data source with given pagination info.
     *
     * @param session active hibernate session.
     * @param pageable pagination info
     * @return query
     */
    Query<R> getQuery(Session session, Pageable pageable);

    /**
     * Returns count query to fetch the count from the underlying data source.
     *
     * @param session active hibernate session
     * @return count query.
     */
    Query<Number> getCountQuery(Session session);

    default Query<R> getQuery(Session session, Pageable pageable, ParametersProvider provider) {
        return provider.configure(session, getQuery(session, pageable));
    }

    default Query<Number> getCountQuery(Session session, ParametersProvider provider) {
        return provider.configure(session, getCountQuery(session));
    }
}
