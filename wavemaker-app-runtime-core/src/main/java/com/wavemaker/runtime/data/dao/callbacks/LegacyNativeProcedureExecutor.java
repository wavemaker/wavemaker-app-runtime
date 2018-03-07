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
package com.wavemaker.runtime.data.dao.callbacks;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.hibernate.Session;
import org.hibernate.dialect.OracleTypesHelper;
import org.hibernate.internal.SessionImpl;
import org.hibernate.query.NativeQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.StringUtils;
import com.wavemaker.commons.util.TypeConversionUtils;
import com.wavemaker.runtime.data.model.CustomProcedure;
import com.wavemaker.runtime.data.model.CustomProcedureParam;
import com.wavemaker.runtime.data.util.ProceduresUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @author Soumya Dumpa
 * @since 26/3/2015
 */
public class LegacyNativeProcedureExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(LegacyNativeProcedureExecutor.class);
    private static final String CURSOR = "cursor";

    public static List<Object> executeProcedure(Session session, CustomProcedure procedure) {
        final List<CustomProcedureParam> procedureParams = prepareParams(procedure.getProcedureParams());
        return executeNativeJDBCCall(session, procedure.getProcedureStr(), procedureParams);
    }

    private static List<Object> executeNativeJDBCCall(
            Session session, String procedureStr, List<CustomProcedureParam>
            customParams) {
        try (Connection conn = ((SessionImpl) session).connection()) {
            List<Integer> cursorPosition = new ArrayList<>();

            NativeQuery sqlProcedure = session.createNativeQuery(procedureStr);
            Set<String> namedParams = sqlProcedure.getParameterMetadata().getNamedParameterNames();
            final String jdbcComplianceProcedure = ProceduresUtils.jdbcComplianceProcedure(procedureStr,
                    namedParams);
            LOGGER.info("JDBC converted procedure {}", jdbcComplianceProcedure);
            try (CallableStatement callableStatement = conn.prepareCall(jdbcComplianceProcedure)) {

                List<Integer> outParams = new ArrayList<>();
                for (int position = 0; position < customParams.size(); position++) {
                    CustomProcedureParam procedureParam = customParams.get(position);
                    if (procedureParam.getProcedureParamType().isOutParam()) {

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
                    if (procedureParam.getProcedureParamType().isInParam()) {
                        callableStatement.setObject(position + 1, procedureParam.getParamValue());
                    }
                }

                LOGGER.info("Executing Procedure {}", procedureStr);
                boolean resultType = callableStatement.execute();
                final List<Object> responseWrapper = new ArrayList<>();
                /* if of type result set */
                if (resultType) {
                    return processResultSet(callableStatement.getResultSet());
                    /* If not cursor and not out params */
                } else if (outParams.isEmpty() && cursorPosition.isEmpty()) {
                    return responseWrapper;
                }

                final Map<String, Object> outData = new LinkedHashMap<>();
                for (Integer outParam : outParams) {
                    outData.put(customParams.get(outParam - 1).getParamName(), callableStatement.getObject(outParam));
                }

                for (Integer cursorIndex : cursorPosition) {
                    outData.put(customParams.get(cursorIndex - 1).getParamName(),
                            processResultSet(callableStatement.getObject(cursorIndex)));
                }
                responseWrapper.add(outData);
                return responseWrapper;
            }

        } catch (Exception e) {
            throw new WMRuntimeException("Failed to execute procedure ", e);
        }
    }

    private static List<CustomProcedureParam> prepareParams(List<CustomProcedureParam> customProcedureParams) {
        if (customProcedureParams != null && !customProcedureParams.isEmpty()) {
            for (CustomProcedureParam customProcedureParam : customProcedureParams) {
                if (StringUtils.splitPackageAndClass(customProcedureParam.getValueType()).v2
                        .equalsIgnoreCase(CURSOR) || customProcedureParam.getProcedureParamType().isOutParam()) {
                    continue;
                }
                Object processedParamValue = getValueObject(customProcedureParam);
                if (processedParamValue != null) {
                    customProcedureParam.setParamValue(processedParamValue);
                }
            }
        }
        return customProcedureParams;
    }

    private static Object getValueObject(CustomProcedureParam customProcedureParam) {
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

    private static List<Object> processResultSet(Object resultSet) {
        ResultSet rset = (ResultSet) resultSet;
        List<Object> result = new ArrayList<>();

        // Dump the cursor
        try {
            while (rset.next()) {
                Map<String, Object> rowData = new LinkedHashMap<>();
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

    private static Integer getTypeCode(String typeName) throws IllegalAccessException, NoSuchFieldException {
        Integer typeCode;
        if (typeName.equalsIgnoreCase(CURSOR)) {
            typeCode = OracleTypesHelper.INSTANCE.getOracleCursorTypeSqlType();
        } else {
            typeCode = typeName.equals("String") ? Types.VARCHAR : (Integer) Types.class
                    .getField(typeName.toUpperCase()).get(null);
        }
        return typeCode;
    }
}
