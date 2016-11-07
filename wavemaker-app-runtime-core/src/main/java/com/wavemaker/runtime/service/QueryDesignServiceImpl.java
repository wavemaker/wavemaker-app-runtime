package com.wavemaker.runtime.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.hibernate.Query;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.type.Type;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.dao.query.WMQueryExecutor;
import com.wavemaker.runtime.data.model.QueryResponse;
import com.wavemaker.runtime.data.model.queries.QueryType;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.model.returns.ReturnType;
import com.wavemaker.runtime.data.util.DataServiceUtils;
import com.wavemaker.studio.common.util.StringTemplate;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/11/16
 */
public class QueryDesignServiceImpl implements QueryDesignService {

    private static final StringTemplate QUERY_EXECUTOR_BEAN_ST = new StringTemplate("${serviceId}WMQueryExecutor");
    private static final StringTemplate SESSION_FACTORY_BEAN_ST = new StringTemplate("${serviceId}SessionFactory");

    private static final StringTemplate TRANSACTION_MANAGER_BEAN_ST = new StringTemplate(
            "${serviceId}TransactionManager");


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
            meta = executeQuery(serviceId, query).getReturnProperties();
        }

        return meta;
    }

    @Override
    public QueryResponse executeQuery(final String serviceId, final RuntimeQuery query) {
        final Map<String, String> map = getStringTemplateMap(serviceId);
        final String queryExecutorBeanName = QUERY_EXECUTOR_BEAN_ST.substitute(map);
        return executeInTransaction(serviceId, new TransactionCallback<QueryResponse>() {
            @Override
            public QueryResponse doInTransaction(TransactionStatus status) {

                WMQueryExecutor queryExecutor = WMAppContext.getInstance().getSpringBean(queryExecutorBeanName);
                QueryResponse response;
                if (isDMLOrUpdateQuery(query)) {
                    final int results = queryExecutor.executeRuntimeQueryForUpdate(query);
                    response = new QueryResponse(results, getMetaForDML());
                } else {
                    final PageRequest pageable = new PageRequest(0, 5, null);
                    Page<Object> pageResponse = queryExecutor.executeRuntimeQuery(query, pageable);
                    if (query.isNativeSql()) {
                        response = new QueryResponse(pageResponse, extractMetaFromResults(pageResponse));
                    } else {
                        response = new QueryResponse(pageResponse, extractMetaForHql(serviceId, query));
                    }
                }
                return response;
            }
        });
    }

    protected List<ReturnProperty> extractMetaForHql(final String serviceId, final RuntimeQuery query) {
        final String sessionFactoryBeanName = SESSION_FACTORY_BEAN_ST.substitute(getStringTemplateMap(serviceId));

        final SessionFactoryImplementor factory = WMAppContext.getInstance().getSpringBean(sessionFactoryBeanName);
        final Query hqlQuery = factory.getCurrentSession().createQuery(query.getQueryString());

        final Type[] returnTypes = hqlQuery.getReturnTypes();
        final String[] returnAliases = hqlQuery.getReturnAliases();
        List<ReturnProperty> properties = new ArrayList<>(returnTypes.length);
        for (int i = 0; i < returnTypes.length; i++) {
            final Type type = returnTypes[i];

            ReturnProperty property = new ReturnProperty();
            if (returnAliases != null && returnAliases.length >= i) {
                property.setName(returnAliases[i]);
            }

            ReturnType returnType = new ReturnType();
            returnType.setRef(type.getName());
            if (type.isCollectionType()) {
                returnType.setType(ReturnType.Type.COLLECTION);
            } else if (type.isAssociationType()) {
                returnType.setType(ReturnType.Type.REFERENCE);
            } else {
                returnType.setType(ReturnType.Type.SIMPLE);
            }
            property.setReturnType(returnType);

            properties.add(property);
        }

        return properties;
    }

    protected List<ReturnProperty> extractMetaFromResults(Page<Object> paginatedResults) {
        final List<Object> results = paginatedResults.getContent();

        List<ReturnProperty> properties = new ArrayList<>();

        if (!results.isEmpty()) {
            final Object result = results.get(0);

            if (result instanceof Map) {// always returns map
                final Map<String, Object> resultMap = (Map<String, Object>) result;
                for (final Map.Entry<String, Object> entry : resultMap.entrySet()) {
                    String type = entry.getValue() == null ? String.class.getName() : entry.getValue().getClass()
                            .getName();
                    properties.add(new ReturnProperty(entry.getKey(), new ReturnType(ReturnType.Type.SIMPLE, type)));
                }
            }
        }

        return properties;
    }

    protected <T> T executeInTransaction(String serviceId, TransactionCallback<T> callback) {
        final String transactionManagerBeanName = TRANSACTION_MANAGER_BEAN_ST
                .substitute(getStringTemplateMap(serviceId));
        PlatformTransactionManager transactionManager = WMAppContext.getInstance()
                .getSpringBean(transactionManagerBeanName);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        return txTemplate.execute(callback);
    }

    private boolean isDMLOrUpdateQuery(RuntimeQuery query) {
        return query.getType() != QueryType.SELECT || DataServiceUtils.isDML(query.getQueryString());
    }

    private List<ReturnProperty> getMetaForDML() {
        return Collections.singletonList(new ReturnProperty(null, new ReturnType(ReturnType.Type.SIMPLE, Integer
                .class.getName())));
    }

    private Map<String, String> getStringTemplateMap(final String serviceId) {
        return Collections.singletonMap("serviceId", serviceId);
    }
}
