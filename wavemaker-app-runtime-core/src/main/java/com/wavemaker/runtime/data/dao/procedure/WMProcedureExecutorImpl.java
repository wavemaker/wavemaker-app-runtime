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
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.PostConstruct;

import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.hibernate.dialect.OracleTypesHelper;
import org.hibernate.internal.SessionImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wavemaker.runtime.WMAppObjectMapper;
import com.wavemaker.runtime.data.dao.callbacks.NativeProcedureExecutor;
import com.wavemaker.runtime.data.dao.callbacks.ResolvableParam;
import com.wavemaker.runtime.data.dao.callbacks.RuntimeParameter;
import com.wavemaker.runtime.data.dao.callbacks.TestParameter;
import com.wavemaker.runtime.data.model.CustomProcedure;
import com.wavemaker.runtime.data.model.CustomProcedureParam;
import com.wavemaker.runtime.data.model.ProcedureParam;
import com.wavemaker.runtime.data.model.ProcedureParamType;
import com.wavemaker.runtime.data.model.procedures.ProcedureParameter;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;
import com.wavemaker.runtime.data.util.ProceduresUtils;
import com.wavemaker.runtime.system.SystemPropertiesUnit;
import com.wavemaker.studio.common.CommonConstants;
import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.IOUtils;
import com.wavemaker.studio.common.util.StringUtils;
import com.wavemaker.studio.common.util.TypeConversionUtils;

public class WMProcedureExecutorImpl implements WMProcedureExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(WMProcedureExecutorImpl.class);
    private static final String CURSOR = "cursor";
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

            procedureMap = WMAppObjectMapper.getInstance().readValue(resourceStream,
                    new TypeReference<Map<String, RuntimeProcedure>>() {
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
    public <T> List<T> executeNamedProcedure(
            final String procedureName, final Map<String, Object> params, final Class<T> type) {
        final List<Object> results = executeNamedProcedure(procedureName, params);

        // convert
        return null;
    }

    @Override
    public List<Object> executeNamedProcedure(String procedureName, Map<String, Object> params) {
        final RuntimeProcedure procedure = procedureMap.get(procedureName);

        try {
            List<ResolvableParam> resolvableParams = new ArrayList<>(procedure.getParameters().size());
            for (final ProcedureParameter parameter : procedure.getParameters()) {
                resolvableParams.add(new RuntimeParameter(parameter, params));
            }

            return NativeProcedureExecutor.execute(template.getSessionFactory().openSession(),
                    procedure.getProcedureString(), resolvableParams);
        } catch (Exception e) {
            throw new WMRuntimeException("Failed to execute Named Procedure", e);
        }
    }

    @Override
    public List<Object> executeRuntimeProcedure(final RuntimeProcedure procedure) {
        List<ResolvableParam> testParameters = new ArrayList<>(procedure.getParameters().size());

        final List<ProcedureParameter> parameters = procedure.getParameters();
        for (final ProcedureParameter parameter : parameters) {
            testParameters.add(new TestParameter(parameter));
        }

        final String procedureString = ProceduresUtils.jdbcComplianceProcedure(procedure.getProcedureString(),
                procedure.getParameters());

        return NativeProcedureExecutor
                .execute(template.getSessionFactory().openSession(), procedureString, testParameters);
    }

    @Override
    public List<Object> executeCustomProcedure(CustomProcedure customProcedure) {
        List<CustomProcedureParam> procedureParams = prepareParams(customProcedure.getProcedureParams());
        return executeProcedure(customProcedure.getProcedureStr(), procedureParams);

    }

    private List<Object> executeProcedure(String procedureString, List<CustomProcedureParam> customParameters) {
        return executeNativeJDBCCall(procedureString, customParameters);
    }

    private List<Object> executeNativeJDBCCall(String procedureStr, List<CustomProcedureParam> customParams) {
        Connection conn = null;
        try {
            Session session = template.getSessionFactory().openSession();
            conn = ((SessionImpl) session).connection();
            List<Integer> cursorPosition = new ArrayList<Integer>();

            SQLQuery sqlProcedure = session.createSQLQuery(procedureStr);
            String[] namedParams = sqlProcedure.getNamedParameters();
            final String jdbcComplianceProcedure = ProceduresUtils.jdbcComplianceProcedure(procedureStr, namedParams);
            LOGGER.info("JDBC converted procedure {}", jdbcComplianceProcedure);
            CallableStatement callableStatement = conn.prepareCall(jdbcComplianceProcedure);

            List<Integer> outParams = new ArrayList<Integer>();
            for (int position = 0; position < customParams.size(); position++) {
                CustomProcedureParam procedureParam = customParams.get(position);
                if (ProceduresUtils.hasOutParamType(procedureParam)) {

                    LOGGER.info("Found out Parameter {}", procedureParam.getParamName());
                    String typeName = StringUtils.splitPackageAndClass(procedureParam.getValueType()).v2;
                    Integer typeCode = getTypeCode(typeName);
                    LOGGER.info("Found type code to be {}", typeCode);
                    callableStatement.registerOutParameter(position + 1, typeCode);

                    if (typeName.equalsIgnoreCase(CURSOR)) {
                        cursorPosition.add(position + 1);

                    } else {
                        outParams.add(position + 1);
                    }
                }
                if (procedureParam.getProcedureParamType().equals(ProcedureParamType.IN) || procedureParam
                        .getProcedureParamType().equals(ProcedureParamType.IN_OUT)) {
                    callableStatement.setObject(position + 1, procedureParam.getParamValue());
                }
            }

            LOGGER.info("Executing Procedure {}", procedureStr);
            boolean resultType = callableStatement.execute();

            List responseWrapper = new ArrayList<Object>();
            /* if of type result set */
            if (resultType) {
                return processResultSet(callableStatement.getResultSet());
                /* If not cursor and not out params */
            } else if (!resultType && outParams.isEmpty() && cursorPosition.isEmpty())
                return responseWrapper;


            Map<String, Object> outData = new LinkedHashMap<String, Object>();
            for (Integer outParam : outParams) {
                outData.put(customParams.get(outParam - 1).getParamName(), callableStatement.getObject(outParam));
            }

            for (Integer cursorIndex : cursorPosition) {
                outData.put(customParams.get(cursorIndex - 1).getParamName(),
                        processResultSet(callableStatement.getObject(cursorIndex)));
            }

            responseWrapper.add(outData);
            return responseWrapper;
        } catch (Exception e) {
            throw new WMRuntimeException("Failed to execute procedure ", e);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    throw new WMRuntimeException("Failed to close connection", e);
                }
            }
        }
    }

    private CustomProcedureParam prepareCustomProcedureParam(
            final Map<String, Object> params, final ProcedureParam procedureParam) {
        String paramName = procedureParam.getParamName();
        Object valueObject = params.get(procedureParam.getParamName());
        if (procedureParam.isSystemParam()) {
            paramName = CommonConstants.SYSTEM_PARAM_PREFIX + procedureParam.getSystemParamName();
            valueObject = SystemPropertiesUnit.valueOf(paramName).getValue();
        }
        return new CustomProcedureParam(paramName, valueObject, procedureParam.getProcedureParamType(),
                procedureParam.getValueType());

    }

    private List<Object> processResultSet(Object resultSet) {
        ResultSet rset = (ResultSet) resultSet;
        List<Object> result = new ArrayList<Object>();

        // Dump the cursor
        try {
            while (rset.next()) {
                Map<String, Object> rowData = new LinkedHashMap<String, Object>();
                int colCount = rset.getMetaData().getColumnCount();
                for (int i = 1; i <= colCount; i++) {
                    rowData.put(rset.getMetaData().getColumnName(i), rset.getObject(i));
                }
                result.add(rowData);
            }
        } catch (SQLException e) {

            throw new WMRuntimeException("Failed to process cursor ", e);
        }

        return result;
    }

    private Integer getTypeCode(String typeName) throws IllegalAccessException, NoSuchFieldException {
        Integer typeCode;
        if (typeName.equalsIgnoreCase(CURSOR)) {
            typeCode = OracleTypesHelper.INSTANCE.getOracleCursorTypeSqlType();
        } else {
            typeCode = typeName.equals("String") ? Types.VARCHAR : (Integer) Types.class
                    .getField(typeName.toUpperCase()).get(null);
        }
        return typeCode;
    }

    private List<CustomProcedureParam> prepareParams(List<CustomProcedureParam> customProcedureParams) {
        if (customProcedureParams != null && !customProcedureParams.isEmpty()) {
            for (CustomProcedureParam customProcedureParam : customProcedureParams) {
                if (StringUtils.splitPackageAndClass(customProcedureParam.getValueType()).v2.equalsIgnoreCase(CURSOR))
                    continue;
                Object processedParamValue = getValueObject(customProcedureParam);
                if (processedParamValue != null) {
                    customProcedureParam.setParamValue(processedParamValue);
                }
            }
        }
        return customProcedureParams;
    }

    private Object getValueObject(CustomProcedureParam customProcedureParam) {
        Object paramValue;
        try {
            Class loader = Class.forName(customProcedureParam.getValueType());
            paramValue = TypeConversionUtils.fromString(loader, customProcedureParam.getParamValue().toString(), false);
        } catch (IllegalArgumentException ex) {
            LOGGER.error("Failed to Convert param value for procedure", ex);
            throw new WMRuntimeException(ex.getMessage(), ex);
        } catch (ClassNotFoundException ex) {
            throw new WMRuntimeException(MessageResource.CLASS_NOT_FOUND, ex,
                    customProcedureParam.getProcedureParamType());
        }
        return paramValue;
    }


}