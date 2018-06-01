/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.dao.query;

import java.io.OutputStream;
import javax.annotation.PostConstruct;

import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateTemplate;

import com.wavemaker.runtime.data.dao.callbacks.NamedQueryExporterCallback;
import com.wavemaker.runtime.data.dao.callbacks.PaginatedQueryCallback;
import com.wavemaker.runtime.data.dao.callbacks.QueryCallback;
import com.wavemaker.runtime.data.dao.callbacks.UpdateQueryCallback;
import com.wavemaker.runtime.data.dao.query.providers.AppRuntimeParameterProvider;
import com.wavemaker.runtime.data.dao.query.providers.RuntimeParametersProvider;
import com.wavemaker.runtime.data.dao.query.providers.RuntimeQueryProvider;
import com.wavemaker.runtime.data.dao.query.providers.SessionBackedQueryProvider;
import com.wavemaker.runtime.data.dao.query.types.SessionBackedParameterResolver;
import com.wavemaker.runtime.data.dao.util.CustomQueryAdapter;
import com.wavemaker.runtime.data.dao.util.PageUtils;
import com.wavemaker.runtime.data.exception.EntityNotFoundException;
import com.wavemaker.runtime.data.export.ExportOptions;
import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.QueryProcedureInput;
import com.wavemaker.runtime.data.model.UpdatableQueryInput;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;

public class WMQueryExecutorImpl implements WMQueryExecutor {

    private HibernateTemplate template;
    private SessionBackedParameterResolver parameterResolvers;

    @PostConstruct
    private void init() {
        parameterResolvers =
                new SessionBackedParameterResolver((SessionFactoryImplementor) template.getSessionFactory());
    }

    @Override
    public <T> T executeNamedQuery(final QueryProcedureInput<T> queryInput) {
        SessionBackedQueryProvider<T> queryProvider = new SessionBackedQueryProvider<>(queryInput.getName(),
                queryInput.getResponseType());
        AppRuntimeParameterProvider parametersProvider = new AppRuntimeParameterProvider(
                queryInput.getParameters(), parameterResolvers.getResolver(queryInput.getName()));

        return template.execute(new QueryCallback<>(queryProvider,
                parametersProvider))
                .orElseThrow(() -> new EntityNotFoundException(
                        "No row exists for given parameters:" + queryInput.getParameters()));
    }

    @Override
    public <T> Page<T> executeNamedQuery(final QueryProcedureInput<T> queryInput, final Pageable pageable) {

        SessionBackedQueryProvider<T> queryProvider = new SessionBackedQueryProvider<>(queryInput.getName(),
                queryInput.getResponseType());
        AppRuntimeParameterProvider parametersProvider = new AppRuntimeParameterProvider(
                queryInput.getParameters(), parameterResolvers.getResolver(queryInput.getName()));

        return template.execute(new PaginatedQueryCallback<>(queryProvider, parametersProvider,
                PageUtils.defaultIfNull(pageable)));
    }

    @Override
    public int executeNamedQuery(final UpdatableQueryInput queryInput) {
        SessionBackedQueryProvider<Integer> queryProvider =
                new SessionBackedQueryProvider<>(queryInput.getName(), Integer.class);
        AppRuntimeParameterProvider parametersProvider = new AppRuntimeParameterProvider(
                queryInput.getParameters(), parameterResolvers.getResolver(queryInput.getName()));

        return template.execute(new UpdateQueryCallback(queryProvider, parametersProvider));
    }

    @Override
    public Page<Object> executeRuntimeQuery(final RuntimeQuery query, final Pageable pageable) {
        final RuntimeQueryProvider<Object> queryProvider = RuntimeQueryProvider.from(query, Object.class);
        final RuntimeParametersProvider parametersProvider = new RuntimeParametersProvider(query);

        return template.execute(
                new PaginatedQueryCallback<>(queryProvider, parametersProvider, PageUtils.defaultIfNull(pageable)));
    }

    @Override
    public int executeRuntimeQueryForUpdate(final RuntimeQuery query) {
        final RuntimeQueryProvider<Integer> queryProvider = RuntimeQueryProvider.from(query, Integer.class);
        final RuntimeParametersProvider parametersProvider = new RuntimeParametersProvider(query);

        return template.execute(new UpdateQueryCallback(queryProvider, parametersProvider));
    }

    @Override
    public Page<Object> executeCustomQuery(CustomQuery customQuery, Pageable pageable) {
        final RuntimeQuery runtimeQuery = CustomQueryAdapter.adapt(customQuery);
        return executeRuntimeQuery(runtimeQuery, PageUtils.defaultIfNull(pageable));
    }

    @Override
    public int executeCustomQueryForUpdate(final CustomQuery customQuery) {
        final RuntimeQuery runtimeQuery = CustomQueryAdapter.adapt(customQuery);
        return executeRuntimeQueryForUpdate(runtimeQuery);
    }

    @Override
    public <T> void exportNamedQueryData(
            final QueryProcedureInput<T> queryInput, final ExportOptions exportOptions, final Pageable pageable,
            final OutputStream outputStream) {
        SessionBackedQueryProvider<T> queryProvider = new SessionBackedQueryProvider<>(queryInput.getName(),
                queryInput.getResponseType());

        AppRuntimeParameterProvider parameterProvider = new AppRuntimeParameterProvider(queryInput.getParameters(),
                parameterResolvers.getResolver(queryInput.getName()));

        NamedQueryExporterCallback<T> callback = new NamedQueryExporterCallback<>(queryProvider, parameterProvider,
                PageUtils.defaultIfNull(pageable), exportOptions, outputStream, queryInput.getResponseType());

        template.executeWithNativeSession(callback);
    }

    public HibernateTemplate getTemplate() {
        return template;
    }

    public void setTemplate(HibernateTemplate template) {
        this.template = template;
    }
}