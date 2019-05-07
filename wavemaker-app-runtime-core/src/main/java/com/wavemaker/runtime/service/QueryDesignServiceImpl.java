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
package com.wavemaker.runtime.service;

import java.util.List;
import java.util.Map;

import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.query.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.StringTemplate;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.dao.query.WMQueryExecutor;
import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.util.HQLQueryUtils;
import com.wavemaker.runtime.util.MultipartQueryUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/11/16
 */
public class QueryDesignServiceImpl extends AbstractDesignService implements QueryDesignService {

    private static final StringTemplate QUERY_EXECUTOR_BEAN_ST = new StringTemplate("${serviceId}WMQueryExecutor");
    private static final StringTemplate SESSION_FACTORY_BEAN_ST = new StringTemplate("${serviceId}SessionFactory");

    @Override
    public List<ReturnProperty> extractMeta(final String serviceId, final RuntimeQuery query) {
        List<ReturnProperty> meta;
        if (DesignTimeServiceUtils.isDMLOrUpdateQuery(query)) {
            meta = DesignTimeServiceUtils.getMetaForDML();
        } else if (!query.isNativeSql()) {
            meta = executeInTransaction(serviceId, status -> extractMetaForHql(serviceId, query));
        } else {
            meta = testRunQuery(serviceId, query, PageRequest.of(0, 5, null)).getReturnProperties();
        }

        return meta;
    }

    @Override
    public DesignServiceResponse testRunQuery(
            final String serviceId, final MultipartHttpServletRequest request, final Pageable pageable) {
        RuntimeQuery query = MultipartQueryUtils.readContent(request, RuntimeQuery.class);
        MultipartQueryUtils.setMultiparts(query.getParameters(), request.getMultiFileMap());
        return testRunQuery(serviceId, query, pageable);
    }

    @Override
    public DesignServiceResponse testRunQuery(
            final String serviceId, final RuntimeQuery query, final Pageable pageable) {
        final Object results = _runQuery(serviceId, query, pageable);
        List<ReturnProperty> meta;

        if (DesignTimeServiceUtils.isDMLOrUpdateQuery(query)) {
            meta = DesignTimeServiceUtils.getMetaForDML();
        } else {
            if (query.isNativeSql()) {
                meta = extractMetaFromResults(((Page<Object>) results).getContent());
            } else {
                meta = executeInTransaction(serviceId, status -> extractMetaForHql(serviceId, query));
            }
        }
        return new DesignServiceResponse(results, meta);
    }

    @Override
    public Object executeQuery(final String serviceId, final RuntimeQuery query, final Pageable pageable) {
        if (DesignTimeServiceUtils.isDMLOrUpdateQuery(query)) {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.update.query.not.allowed"));
        }
        return _runQuery(serviceId, query, pageable);
    }

    protected Object _runQuery(final String serviceId, final RuntimeQuery query, final Pageable pageable) {
        final Map<String, String> map = getStringTemplateMap(serviceId);
        final String queryExecutorBeanName = QUERY_EXECUTOR_BEAN_ST.substitute(map);
        return executeInTransaction(serviceId, status -> {
            WMQueryExecutor queryExecutor = WMAppContext.getInstance().getSpringBean(queryExecutorBeanName);
            Object response;
            if (DesignTimeServiceUtils.isDMLOrUpdateQuery(query)) {
                response = queryExecutor.executeRuntimeQueryForUpdate(query);
            } else {
                response = queryExecutor.executeRuntimeQuery(query, pageable);
            }
            return response;
        });
    }

    protected List<ReturnProperty> extractMetaForHql(final String serviceId, final RuntimeQuery query) {
        final String sessionFactoryBeanName = SESSION_FACTORY_BEAN_ST.substitute(getStringTemplateMap(serviceId));

        final SessionFactoryImplementor factory = WMAppContext.getInstance().getSpringBean(sessionFactoryBeanName);
        final Query hqlQuery = factory.getCurrentSession().createQuery(query.getQueryString());

        return HQLQueryUtils.extractMetaForHql(hqlQuery);
    }
}
