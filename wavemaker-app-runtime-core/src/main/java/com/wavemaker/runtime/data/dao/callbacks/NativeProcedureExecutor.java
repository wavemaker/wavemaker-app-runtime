package com.wavemaker.runtime.data.dao.callbacks;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.Session;
import org.hibernate.internal.SessionImpl;

import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.IOUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/11/16
 */
public class NativeProcedureExecutor {

    public static List<Object> execute(
            Session session, String jdbcQuery, List<ResolvableParam>
            params) {
        Connection connection = null;
        try {
            connection = ((SessionImpl) session).connection();
            final CallableStatement statement = connection.prepareCall(jdbcQuery);

            configureParameters(statement, params);

            final boolean resultSetType = statement.execute();
            List<Object> result;
            if (resultSetType) {
                result = readResultSet(statement.getResultSet());
            } else {
                result = Collections.singletonList(readResponse(statement, params));
            }
            return result;
        } catch (SQLException e) {
            throw new WMRuntimeException("Error while executing Procedure", e);
        } finally {
            IOUtils.closeSilently(connection);
        }
    }

    protected static void configureParameters(
            final CallableStatement statement, final List<ResolvableParam> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            final ResolvableParam param = params.get(i);
            if (param.getParameter().getParameterType().isOutParam()) {
                statement.registerOutParameter(i + 1, param.getParameter().getType().getSqlTypeCode());
            }
            if (param.getParameter().getParameterType().isInParam()) {
                statement.setObject(i + 1, param.getValue());
            }
        }
    }

    private static Object readResponse(
            CallableStatement statement, final List<ResolvableParam> params) throws SQLException {
        Map<String, Object> result = new LinkedHashMap<>();

        for (int i = 0; i < params.size(); i++) {
            final ResolvableParam param = params.get(i);

            if (param.getParameter().getParameterType().isOutParam()) {
                Object value = statement.getObject(i + 1);
                if (param.getParameter().getType() == JavaType.CURSOR) {
                    value = readResultSet(value);
                }
                result.put(param.getParameter().getName(), value);
            }
        }

        return result;
    }

    private static List<Object> readResultSet(Object resultSet) {
        ResultSet rset = (ResultSet) resultSet;
        List<Object> result = new ArrayList<>();

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
}
