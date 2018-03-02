package com.wavemaker.runtime.data.dao.query.providers;

import java.util.Optional;
import javax.persistence.Entity;

import org.hibernate.Session;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.engine.spi.SessionImplementor;
import org.hibernate.query.Query;
import org.hibernate.query.spi.NamedQueryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.transform.Transformers;
import com.wavemaker.runtime.data.transform.WMResultTransformer;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 1/8/17
 */
public class SessionBackedQueryProvider<R> implements QueryProvider<R>, PaginatedQueryProvider<R> {

    private static final Logger LOGGER = LoggerFactory.getLogger(SessionBackedQueryProvider.class);

    private String name;
    private Class<R> responseType;

    public SessionBackedQueryProvider(final String name, final Class<R> responseType) {
        this.name = name;
        this.responseType = responseType;
    }

    @Override
    public Query<R> getQuery(final Session session) {
        return getAndConfigureQuery(session, name, responseType);
    }

    @Override
    public Query<R> getQuery(final Session session, final Pageable pageable) {
        Query<R> query;
        final Sort sort = pageable.getSort();
        final WMResultTransformer transformer = Transformers.aliasToMappedClass(responseType);

        if (sort != null) {
            query = createSortedQuery(session, sort, transformer);
        } else {
            query = getAndConfigureQuery(session, name, responseType);
        }

        query.setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize());

        return query;
    }

    @Override
    public Optional<Query<Number>> getCountQuery(final Session session) {
        Query<Number> query = null;

        final String countQueryName = this.name + "__count";
        final NamedQueryRepository repository = ((SessionFactoryImplementor) session.getSessionFactory())
                .getNamedQueryRepository();
        if (queryExists(repository, countQueryName)) {
            query = getAndConfigureQuery(session, countQueryName, Number.class);
        } else {
            LOGGER.debug("Count query not found for query:{}", name);
        }

        return Optional.ofNullable(query);
    }

    @SuppressWarnings("unchecked")
    private <T> Query<T> getAndConfigureQuery(final Session session, String name, Class<T> type) {
        final Query<T> query;

        if (isMappedType(type)) {
            query = session.createNamedQuery(name, type);
        } else {
            query = session.createNamedQuery(name);
            Transformers.aliasToMappedClassOptional(type).ifPresent(query::setResultTransformer);
        }

        return query;
    }

    @SuppressWarnings("unchecked")
    private Query<R> createSortedQuery(final Session session, final Sort sort, final WMResultTransformer transformer) {
        final Query<R> query;
        final NamedQueryRepository repository = ((SessionFactoryImplementor) session.getSessionFactory())
                .getNamedQueryRepository();
        if (repository.getNamedQueryDefinition(name) != null) {
            final String sortedQuery = QueryHelper
                    .applySortingForHqlQuery(repository.getNamedQueryDefinition(name).getQueryString(), sort,
                            transformer);
            if (isMappedType(responseType)) {
                query = session.createQuery(sortedQuery, responseType);
            } else {
                query = session.createQuery(sortedQuery).setResultTransformer(transformer);

            }
        } else if (repository.getNamedSQLQueryDefinition(name) != null) {
            final String sortedQuery = QueryHelper
                    .applySortingForNativeQuery(repository.getNamedSQLQueryDefinition(name).getQueryString(),
                            sort, transformer,
                            ((SessionFactoryImplementor) session.getSessionFactory()).getDialect());
            query = session.createNativeQuery(sortedQuery).setResultTransformer(transformer);
        } else {
            throw ((SessionImplementor) session).getExceptionConverter()
                    .convert(new IllegalArgumentException("No query defined for that name [" + name + "]"));
        }
        return query;
    }

    private boolean queryExists(final NamedQueryRepository repository, final String countQueryName) {
        return repository.getNamedQueryDefinition(countQueryName) != null || repository.getNamedSQLQueryDefinition
                (countQueryName) != null;
    }

    private boolean isMappedType(Class<?> type) {
        return type.isAnnotationPresent(Entity.class);
    }
}
