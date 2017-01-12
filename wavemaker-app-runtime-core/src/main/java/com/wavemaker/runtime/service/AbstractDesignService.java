package com.wavemaker.runtime.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.model.ReferenceType;
import com.wavemaker.runtime.data.model.returns.FieldType;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
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
    protected List<ReturnProperty> extractMetaFromResults(Collection<Object> results) {

        List<ReturnProperty> properties = new ArrayList<>();

        if (!results.isEmpty()) {
            final Object result = results.iterator().next();

            if (result instanceof Map) {// always returns map
                final Map<String, Object> resultMap = (Map<String, Object>) result;
                for (final Map.Entry<String, Object> entry : resultMap.entrySet()) {
                    final Object value = entry.getValue();
                    FieldType fieldType;
                    if (value instanceof Collection) {
                        fieldType = new FieldType();
                        fieldType.setList(true);
                        fieldType.setType(ReferenceType.CUSTOM);
                        fieldType.setProperties(extractMetaFromResults(((Collection) value)));
                    } else {
                        String type = value == null ? Object.class.getName() : value.getClass().getName();
                        fieldType = new FieldType(ReferenceType.PRIMITIVE, type);
                    }
                    properties.add(new ReturnProperty(entry.getKey(), fieldType));
                }
            }
        }

        return properties;
    }


    protected Map<String, String> getStringTemplateMap(final String serviceId) {
        return Collections.singletonMap("serviceId", serviceId);
    }
}
