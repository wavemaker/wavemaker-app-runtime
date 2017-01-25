/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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
package com.wavemaker.runtime.data.dao.procedure;


import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wavemaker.runtime.data.dao.callbacks.LegacyNativeProcedureExecutor;
import com.wavemaker.runtime.data.dao.callbacks.NativeProcedureExecutor;
import com.wavemaker.runtime.data.dao.procedure.parameters.ResolvableParam;
import com.wavemaker.runtime.data.dao.procedure.parameters.RuntimeParameter;
import com.wavemaker.runtime.data.dao.procedure.parameters.TestParameter;
import com.wavemaker.runtime.data.model.CustomProcedure;
import com.wavemaker.runtime.data.model.procedures.ProcedureParameter;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;
import com.wavemaker.runtime.data.util.ProceduresUtils;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.util.IOUtils;

public class WMProcedureExecutorImpl implements WMProcedureExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(WMProcedureExecutorImpl.class);
    private Map<String, RuntimeProcedure> procedureMap;

    private HibernateTemplate template = null;
    private String serviceId = null;

    public HibernateTemplate getTemplate() {
        return template;
    }

    public void setTemplate(HibernateTemplate template) {
        this.template = template;
    }

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    @PostConstruct
    protected void init() {
        InputStream resourceStream = null;
        try {
            ClassLoader contextClassLoader = Thread.currentThread().getContextClassLoader();
            ClassLoader webAppClassLoader = WMProcedureExecutorImpl.class.getClassLoader();
            resourceStream = contextClassLoader.getResourceAsStream(serviceId + "-procedures.mappings.json");
            if (resourceStream != null) {
                LOGGER.info("Using the file {}-procedures.mappings.json from context classLoader {}", serviceId,
                        contextClassLoader);
            } else {
                LOGGER.warn("Could not find {}-procedures.mappings.json in context classLoader {}", serviceId,
                        contextClassLoader);
                resourceStream = webAppClassLoader.getResourceAsStream(serviceId + "-procedures.mappings.json");
                if (resourceStream != null) {
                    LOGGER.warn("Using the file {}-procedures.mappings.json from webApp classLoader {}", serviceId,
                            webAppClassLoader);
                } else {
                    LOGGER.warn("Could not find {}-procedures.mappings.json in webApp classLoader {} also", serviceId,
                            webAppClassLoader);
                    throw new WMRuntimeException(
                            serviceId + "-procedures.mappings.json file is not found in either of webAppClassLoader or contextClassLoader");
                }
            }

            procedureMap = JSONUtils.toObject(resourceStream, new TypeReference<Map<String, RuntimeProcedure>>() {
            });
        } catch (WMRuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new WMRuntimeException("Failed to map the procedures mapping file", e);
        } finally {
            IOUtils.closeSilently(resourceStream);
        }
    }

    @Override
    public <T> T executeNamedProcedure(
            final String procedureName, final Map<String, Object> params, final Class<T> type) {
        final RuntimeProcedure procedure = procedureMap.get(procedureName);

        try {
            List<ResolvableParam> resolvableParams = new ArrayList<>(procedure.getParameters().size());
            for (final ProcedureParameter parameter : procedure.getParameters()) {
                resolvableParams.add(new RuntimeParameter(parameter, params));
            }

            return NativeProcedureExecutor.execute(template.getSessionFactory().openSession(),
                    procedure.getProcedureString(), resolvableParams, type);
        } catch (Exception e) {
            throw new WMRuntimeException("Failed to execute Named Procedure", e);
        }
    }

    @Override
    public List<Object> executeNamedProcedure(String procedureName, Map<String, Object> params) {
        return NativeProcedureExecutor.convertToOldResponse(executeNamedProcedure(procedureName, params, Map.class));
    }

    @Override
    public Object executeRuntimeProcedure(final RuntimeProcedure procedure) {
        List<ResolvableParam> testParameters = new ArrayList<>(procedure.getParameters().size());

        final List<ProcedureParameter> parameters = procedure.getParameters();
        for (final ProcedureParameter parameter : parameters) {
            testParameters.add(new TestParameter(parameter));
        }

        final String procedureString = ProceduresUtils.jdbcComplianceProcedure(procedure.getProcedureString(),
                procedure.getParameters());

        return NativeProcedureExecutor
                .execute(template.getSessionFactory().openSession(), procedureString, testParameters, Object.class);
    }

    @Override
    public List<Object> executeCustomProcedure(CustomProcedure customProcedure) {
        return LegacyNativeProcedureExecutor.executeProcedure(template.getSessionFactory().openSession(),
                customProcedure);
    }

}