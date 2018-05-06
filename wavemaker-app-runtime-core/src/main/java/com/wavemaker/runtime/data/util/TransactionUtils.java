package com.wavemaker.runtime.data.util;

import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import com.wavemaker.runtime.WMAppContext;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/5/18
 */
public interface TransactionUtils {

    static <T> T executeInReadOnlyTransaction(String txManagerId, TransactionCallback<T> callback) {
        return executeInTransaction(txManagerId, true, callback);
    }

    static <T> T executeInTransaction(String txManagerId, boolean readOnly, TransactionCallback<T> callback) {
        PlatformTransactionManager transactionManager = WMAppContext.getInstance()
                .getSpringBean(txManagerId);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        txTemplate.setReadOnly(readOnly);

        return txTemplate.execute(callback);
    }
}
