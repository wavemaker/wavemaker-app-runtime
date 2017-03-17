package com.wavemaker.runtime.data.dao.callbacks;

import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.hibernate.Query;
import org.hibernate.Session;
import org.springframework.data.domain.Pageable;

import com.google.common.base.Optional;

import static com.wavemaker.runtime.data.dao.util.QueryHelper.createQuery;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/3/17
 */
public class RuntimePaginatedCallback extends AbstractPaginatedQueryCallback<Map<String, Object>> {

    private String query;
    private String countQuery;
    private Map<String, Object> parameters;
    private Pageable pageable;

    private boolean isNative;

    public RuntimePaginatedCallback(
            final String query, final String countQuery, final Map<String, Object> parameters,
            final Pageable pageable) {
        this.query = query;
        this.countQuery = countQuery;
        this.parameters = parameters;
        this.pageable = pageable;
    }

    public RuntimePaginatedCallback(
            final String query, final String countQuery, final Map<String, Object> parameters,
            final Pageable pageable, final boolean isNative) {
        this.query = query;
        this.countQuery = countQuery;
        this.parameters = parameters;
        this.pageable = pageable;
        this.isNative = isNative;
    }

    @Override
    protected Query getQuery(final Session session) {
        return createQuery(session, isNative, query);
    }

    @Override
    protected Optional<Query> getCountQuery(final Session session) {
        if (StringUtils.isBlank(countQuery)) {
            return Optional.absent();
        } else {
            return Optional.of(createQuery(session, isNative, countQuery));
        }
    }

    @Override
    protected Map<String, Object> getParameters() {
        return parameters;
    }

    @Override
    protected Pageable getPageable() {
        return pageable;
    }

    @Override
    protected Class<Map> getReturnType() {
        return Map.class;
    }
}
