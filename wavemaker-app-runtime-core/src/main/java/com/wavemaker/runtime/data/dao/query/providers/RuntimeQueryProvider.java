package com.wavemaker.runtime.data.dao.query.providers;

import org.apache.commons.lang3.StringUtils;
import org.hibernate.Session;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.query.Query;
import org.springframework.data.domain.Pageable;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.transform.Transformers;
import com.wavemaker.runtime.data.transform.WMResultTransformer;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 4/8/17
 */
public class RuntimeQueryProvider<R> implements QueryProvider<R>, PaginatedQueryProvider<R> {

    private final String queryString;
    private final String countQueryString;

    private final boolean nativeSql;

    private final Class<R> responseType;

    private RuntimeQueryProvider(final Builder<R> builder) {
        queryString = builder.queryString;
        countQueryString = builder.countQueryString;
        nativeSql = builder.nativeSql;
        responseType = builder.responseType;
    }

    public static <R> RuntimeQueryProvider<R> from(RuntimeQuery query, Class<R> returnType) {
        String countQueryString = query.getCountQueryString();

        if (StringUtils.isBlank(countQueryString)) {
            countQueryString = QueryHelper.getCountQuery(query.getQueryString(), query.isNativeSql());
        }

        return RuntimeQueryProvider.newBuilder(returnType)
                .withQueryString(query.getQueryString())
                .withCountQueryString(countQueryString)
                .withNativeSql(query.isNativeSql())
                .build();
    }

    public static <R> Builder<R> newBuilder(Class<R> responseType) {
        return new Builder<>(responseType);
    }

    @Override
    public Query<R> getQuery(final Session session, final Pageable pageable) {
        String sortedQuery;

        final WMResultTransformer transformer = Transformers.aliasToMappedClass(responseType);
        if (nativeSql) {
            sortedQuery = QueryHelper.applySortingForNativeQuery(queryString, pageable.getSort(),
                    transformer,
                    ((SessionFactoryImplementor) session.getSessionFactory()).getDialect());
        } else {
            sortedQuery = QueryHelper.applySortingForHqlQuery(queryString, pageable.getSort(), transformer);
        }
        Query<R> hibernateQuery = createQuery(session, sortedQuery, responseType);

        hibernateQuery.setFirstResult(pageable.getOffset());
        hibernateQuery.setMaxResults(pageable.getPageSize());

        return hibernateQuery;
    }

    @Override
    public Query<Number> getCountQuery(final Session session) {
        return createQuery(session, countQueryString, Number.class);
    }

    @Override
    public Query<R> getQuery(final Session session) {
        return createQuery(session, queryString, responseType);
    }

    @SuppressWarnings("unchecked")
    private <T> Query<T> createQuery(final Session session, String queryString, final Class<T> returnType) {
        final Query<T> hibernateQuery;
        if (nativeSql) {
            hibernateQuery = session.createNativeQuery(queryString);
        } else {
            hibernateQuery = session.createQuery(queryString);
        }

        Transformers.aliasToMappedClassOptional(returnType).ifPresent(hibernateQuery::setResultTransformer);

        return hibernateQuery;
    }

    public static final class Builder<R> {
        private String queryString;
        private String countQueryString;
        private boolean nativeSql = false;
        private Class<R> responseType;

        private Builder(Class<R> responseType) {
            this.responseType = responseType;
        }

        public Builder<R> withQueryString(final String val) {
            queryString = val;
            return this;
        }

        public Builder<R> withCountQueryString(final String val) {
            countQueryString = val;
            return this;
        }

        public Builder<R> withNativeSql(final boolean val) {
            nativeSql = val;
            return this;
        }

        public RuntimeQueryProvider<R> build() {
            return new RuntimeQueryProvider<>(this);
        }
    }
}
