package com.wavemaker.runtime.data.model;

import java.util.Map;

import org.springframework.data.domain.Pageable;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class PageableQueryInfo<T> extends QueryInfo<T> {

    private final Pageable pageable;

    public PageableQueryInfo(
            final String queryName, final Map<String, Object> params, final Class<T> returnClass,
            final Pageable pageable) {
        super(queryName, params, returnClass);
        this.pageable = pageable;
    }

    public Pageable getPageable() {
        return pageable;
    }
}
