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

import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.hibernate.dialect.OracleTypesHelper;
import org.hibernate.internal.SessionImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.data.model.CustomProcedure;
import com.wavemaker.runtime.data.model.CustomProcedureParam;
import com.wavemaker.runtime.data.model.ProcedureParamType;
import com.wavemaker.runtime.data.util.ProceduresUtils;
import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.StringUtils;
import com.wavemaker.studio.common.util.TypeConversionUtils;

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
        Connection conn = null;
        try {
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
            } else if (outParams.isEmpty() && cursorPosition.isEmpty()) {
                return responseWrapper;
            }


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

    private static List<CustomProcedureParam> prepareParams(List<CustomProcedureParam> customProcedureParams) {
        if (customProcedureParams != null && !customProcedureParams.isEmpty()) {
            for (CustomProcedureParam customProcedureParam : customProcedureParams) {
                if (StringUtils.splitPackageAndClass(customProcedureParam.getValueType()).v2
                        .equalsIgnoreCase(CURSOR) || customProcedureParam
                        .getProcedureParamType().OUT == ProcedureParamType.OUT)
                    continue;
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
