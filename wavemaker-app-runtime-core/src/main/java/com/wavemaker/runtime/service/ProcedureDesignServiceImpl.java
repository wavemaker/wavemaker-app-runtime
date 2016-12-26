package com.wavemaker.runtime.service;

import java.util.List;
import java.util.Map;

import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.dao.procedure.WMProcedureExecutor;
import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.studio.common.util.StringTemplate;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 17/11/16
 */
public class ProcedureDesignServiceImpl extends AbstractDesignService implements ProcedureDesignService {

    private static final StringTemplate PROCEDURE_EXECUTOR_BEAN_ST = new StringTemplate(
            "${serviceId}WMProcedureExecutor");


    @Override
    public DesignServiceResponse testRunProcedure(final String serviceId, final RuntimeProcedure procedure) {
        final Map<String, String> map = getStringTemplateMap(serviceId);
        final String procedureExecutorBeanName = PROCEDURE_EXECUTOR_BEAN_ST.substitute(map);
        return executeInTransaction(serviceId, new TransactionCallback<DesignServiceResponse>() {
            @Override
            public DesignServiceResponse doInTransaction(final TransactionStatus status) {
                final WMProcedureExecutor procedureExector = WMAppContext.getInstance()
                        .getSpringBean(procedureExecutorBeanName);
                final List<Object> results = procedureExector.executeRuntimeProcedure(procedure);
                final List<ReturnProperty> properties = extractMetaFromResults(results);
                return new DesignServiceResponse(results, properties);
            }
        });
    }
}
