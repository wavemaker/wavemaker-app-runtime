package com.wavemaker.runtime.data.util;


import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateTemplate;

import com.wavemaker.runtime.data.dao.callbacks.PaginatedQueryCallback;
import com.wavemaker.runtime.data.dao.callbacks.QueryCallback;
import com.wavemaker.runtime.data.dao.query.providers.AppRuntimeParameterProvider;
import com.wavemaker.runtime.data.dao.query.providers.ParametersProvider;
import com.wavemaker.runtime.data.dao.query.providers.RuntimeQueryProvider;
import com.wavemaker.runtime.data.dao.query.types.HqlParameterTypeResolver;
import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.hql.SelectQueryBuilder;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 30/11/17
 */
public class HqlQueryHelper {

    public static <R> Page<R> execute(
            HibernateTemplate template, Class<R> returnType, SelectQueryBuilder builder,
            Pageable pageable) {

        final WMQueryInfo queryInfo = builder.build();

        final RuntimeQueryProvider<R> queryProvider = RuntimeQueryProvider.from(queryInfo, returnType);
        ParametersProvider parametersProvider = new AppRuntimeParameterProvider(queryInfo.getParameters(),
                new HqlParameterTypeResolver());

        return template
                .execute(new PaginatedQueryCallback<>(queryProvider, parametersProvider, pageable));
    }

    public static <R> Optional<R> execute(
            HibernateTemplate template, Class<R> returnType, SelectQueryBuilder builder) {

        final WMQueryInfo queryInfo = builder.build();

        final RuntimeQueryProvider<R> queryProvider = RuntimeQueryProvider.from(queryInfo, returnType);

        ParametersProvider parametersProvider = new AppRuntimeParameterProvider(queryInfo.getParameters(),
                new HqlParameterTypeResolver());

        return template.execute(new QueryCallback<>(queryProvider, parametersProvider));
    }
}
