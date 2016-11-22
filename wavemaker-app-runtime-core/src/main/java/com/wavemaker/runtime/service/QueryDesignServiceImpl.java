package com.wavemaker.runtime.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.hibernate.Query;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.type.AbstractStandardBasicType;
import org.hibernate.type.Type;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
            meta = executeQuery(serviceId, query).getReturnProperties();
        }

        return meta;
    }

    @Override
    public DesignServiceResponse executeQuery(final String serviceId, final RuntimeQuery query) {
        final Map<String, String> map = getStringTemplateMap(serviceId);
        final String queryExecutorBeanName = QUERY_EXECUTOR_BEAN_ST.substitute(map);
        return executeInTransaction(serviceId, new TransactionCallback<DesignServiceResponse>() {
            @Override
            public DesignServiceResponse doInTransaction(TransactionStatus status) {

                WMQueryExecutor queryExecutor = WMAppContext.getInstance().getSpringBean(queryExecutorBeanName);
                DesignServiceResponse response;
                if (isDMLOrUpdateQuery(query)) {
                    final int results = queryExecutor.executeRuntimeQueryForUpdate(query);
                    response = new DesignServiceResponse(results, getMetaForDML());
                } else {
                    final PageRequest pageable = new PageRequest(0, 5, null);
                    Page<Object> pageResponse = queryExecutor.executeRuntimeQuery(query, pageable);
                    if (query.isNativeSql()) {
                        response = new DesignServiceResponse(pageResponse,
                                extractMetaFromResults(pageResponse.getContent()));
                    } else {
                        response = new DesignServiceResponse(pageResponse, extractMetaForHql(serviceId, query));
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

            FieldType fieldType = new FieldType();
            String typeRef = type.getName();
            if (type.isCollectionType()) {
                fieldType.setType(FieldType.Type.COLLECTION);
            } else if (type.isAssociationType()) {
                fieldType.setType(FieldType.Type.REFERENCE);
            } else {
                fieldType.setType(FieldType.Type.SIMPLE);
            }
            if (type instanceof AbstractStandardBasicType) {
                typeRef = ((AbstractStandardBasicType) type).getJavaTypeDescriptor().getJavaTypeClass().getName();
            }

            fieldType.setRef(typeRef);
            property.setFieldType(fieldType);

            properties.add(property);
        }

        return properties;
    }

    private boolean isDMLOrUpdateQuery(RuntimeQuery query) {
        return query.getType() != QueryType.SELECT || DataServiceUtils.isDML(query.getQueryString());
    }

    private List<ReturnProperty> getMetaForDML() {
        return Collections.singletonList(new ReturnProperty(null, new FieldType(FieldType.Type.SIMPLE, Integer
                .class.getName())));
    }
}
