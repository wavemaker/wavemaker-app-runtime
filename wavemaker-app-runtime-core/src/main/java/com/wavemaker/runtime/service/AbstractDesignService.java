package com.wavemaker.runtime.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.model.returns.ReturnType;
import com.wavemaker.studio.common.util.StringTemplate;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 17/11/16
 */
public abstract class AbstractDesignService {

    private static final StringTemplate TRANSACTION_MANAGER_BEAN_ST = new StringTemplate(
            "${serviceId}TransactionManager");

    protected <T> T executeInTransaction(String serviceId, TransactionCallback<T> callback) {
        final String transactionManagerBeanName = TRANSACTION_MANAGER_BEAN_ST
                .substitute(getStringTemplateMap(serviceId));
        PlatformTransactionManager transactionManager = WMAppContext.getInstance()
                .getSpringBean(transactionManagerBeanName);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        return txTemplate.execute(callback);
    }

    @SuppressWarnings("unchecked")
    protected List<ReturnProperty> extractMetaFromResults(List<Object> results) {

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


    protected Map<String, String> getStringTemplateMap(final String serviceId) {
        return Collections.singletonMap("serviceId", serviceId);
    }
}
