package com.wavemaker.runtime.service;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.hibernate.Query;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.dao.query.WMQueryExecutor;
import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.queries.QueryType;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.model.returns.FieldType;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.util.DataServiceUtils;
import com.wavemaker.runtime.data.util.HQLQueryUtils;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.StringTemplate;

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
        if (isDMLOrUpdateQuery(query)) {
            meta = getMetaForDML();
        } else if (!query.isNativeSql()) {
            meta = executeInTransaction(serviceId, new TransactionCallback<List<ReturnProperty>>() {
                @Override
                public List<ReturnProperty> doInTransaction(final TransactionStatus status) {
                    return extractMetaForHql(serviceId, query);
                }
            });
        } else {
            meta = testRunQuery(serviceId, query).getReturnProperties();
        }

        return meta;
    }

    @Override
    public DesignServiceResponse testRunQuery(final String serviceId, final RuntimeQuery query) {
        final Object results = _runQuery(serviceId, query, new PageRequest(0, 5, null));
        List<ReturnProperty> meta;

        if (isDMLOrUpdateQuery(query)) {
            meta = getMetaForDML();
        } else {
            if (query.isNativeSql()) {
                meta = extractMetaFromResults(((Page<Object>) results).getContent());
            } else {
                meta = executeInTransaction(serviceId, new TransactionCallback<List<ReturnProperty>>() {
                    @Override
                    public List<ReturnProperty> doInTransaction(final TransactionStatus status) {
                        return extractMetaForHql(serviceId, query);
                    }
                });
            }
        }
        return new DesignServiceResponse(results, meta);
    }

    @Override
    public Object executeQuery(final String serviceId, final RuntimeQuery query, final Pageable pageable) {
        if (isDMLOrUpdateQuery(query)) {
            throw new WMRuntimeException("Update queries not allowed");
        }
        return _runQuery(serviceId, query, pageable);
    }

    protected Object _runQuery(final String serviceId, final RuntimeQuery query, final Pageable pageable) {
        final Map<String, String> map = getStringTemplateMap(serviceId);
        final String queryExecutorBeanName = QUERY_EXECUTOR_BEAN_ST.substitute(map);
        return executeInTransaction(serviceId, new TransactionCallback<Object>() {
            @Override
            public Object doInTransaction(TransactionStatus status) {
                WMQueryExecutor queryExecutor = WMAppContext.getInstance().getSpringBean(queryExecutorBeanName);
                Object response;
                if (isDMLOrUpdateQuery(query)) {
                    response = queryExecutor.executeRuntimeQueryForUpdate(query);
                } else {
                    response = queryExecutor.executeRuntimeQuery(query, pageable);
                }
                return response;
            }
        });
    }

    protected List<ReturnProperty> extractMetaForHql(final String serviceId, final RuntimeQuery query) {
        final String sessionFactoryBeanName = SESSION_FACTORY_BEAN_ST.substitute(getStringTemplateMap(serviceId));

        final SessionFactoryImplementor factory = WMAppContext.getInstance().getSpringBean(sessionFactoryBeanName);
        final Query hqlQuery = factory.getCurrentSession().createQuery(query.getQueryString());

        return HQLQueryUtils.extractMetaForHql(hqlQuery);
    }

    private boolean isDMLOrUpdateQuery(RuntimeQuery query) {
        return query.getType() != QueryType.SELECT && DataServiceUtils.isDML(query.getQueryString());
    }

    private List<ReturnProperty> getMetaForDML() {
        return Collections.singletonList(new ReturnProperty(null, new FieldType(FieldType.Type.SIMPLE, Integer
                .class.getName())));
    }
}
