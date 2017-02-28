/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.Session;
import org.hibernate.internal.SessionImpl;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.IOUtils;
import com.wavemaker.runtime.data.dao.procedure.parameters.ResolvableParam;
import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.runtime.data.transform.Transformers;
import com.wavemaker.runtime.data.transform.WMResultTransformer;
import com.wavemaker.runtime.data.util.JDBCUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/11/16
 */
public class NativeProcedureExecutor {

    public static <T> T execute(
            Session session, String jdbcQuery, List<ResolvableParam> params, Class<T> type) {
        Connection connection = null;
        try {
            connection = ((SessionImpl) session).connection();
            final CallableStatement statement = prepareStatement(connection, jdbcQuery, params);
            final boolean resultSetType = statement.execute();
            Map<String, Object> result = getResultMap(statement, params, resultSetType, 0);
            return convert(result, type);
        } catch (SQLException e) {
            throw new WMRuntimeException("Error while executing Procedure", e);
        } finally {
            IOUtils.closeSilently(connection);
        }
    }

    public static CallableStatement prepareStatement(
            Connection connection, String jdbcQuery, List<ResolvableParam> params) throws SQLException {
        final CallableStatement statement = connection.prepareCall(jdbcQuery);
        configureParameters(statement, params);
        return statement;
    }

    public static Map<String, Object> getResultMap(
            final CallableStatement statement, final List<ResolvableParam> params,
            final boolean resultSetType, final int limit) throws SQLException {
        Map<String, Object> result = new LinkedHashMap<>();
        if (resultSetType) {
            result.put("content", readResultSet(statement.getResultSet(), limit));
        }
        result.putAll(readResponse(statement, params, limit));
        return result;
    }

    public static List<Object> convertToOldResponse(Map result) {
        List response = Collections.singletonList(result);
        if (result.keySet().size() == 1) {
            final Object firstValue = result.values().iterator().next();
            if (firstValue instanceof List) {
                response = (List) firstValue;
            }
        }
        return response;
    }

    @SuppressWarnings(value = "unchecked")
    protected static <T> T convert(final Map<String, Object> object, final Class<T> type) {
        final WMResultTransformer transformer = Transformers.aliasToMappedClass(type);
        return (T) transformer.transformFromMap(object);
    }

    protected static void configureParameters(
            final CallableStatement statement, final List<ResolvableParam> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            final ResolvableParam param = params.get(i);
            if (param.getParameter().getParameterType().isOutParam()) {
                statement.registerOutParameter(i + 1, JDBCUtils.getSqlTypeCode(param.getParameter().getType()));
            }
            if (param.getParameter().getParameterType().isInParam()) {
                // not checking required flag in parameter since spring will handle this in deserialization.
                if (param.getValue() != null) {
                    statement.setObject(i + 1, param.getValue(),
                            JDBCUtils.getSqlTypeCode(param.getParameter().getType()));
                } else {
                    statement.setNull(i + 1, JDBCUtils.getSqlTypeCode(param.getParameter().getType()));
                }
            }
        }
    }

    private static Map<String, Object> readResponse(
            CallableStatement statement, final List<ResolvableParam> params, final int limit) throws SQLException {
        Map<String, Object> result = new LinkedHashMap<>();

        for (int i = 0; i < params.size(); i++) {
            final ResolvableParam param = params.get(i);

            if (param.getParameter().getParameterType().isOutParam()) {
                Object value = statement.getObject(i + 1);
                if (param.getParameter().getType() == JavaType.CURSOR) {
                    value = readResultSet(value, limit);
                }
                result.put(param.getParameter().getName(), value);
            }
        }

        return result;
    }

    private static List<Map<String, Object>> readResultSet(Object resultSet, final int limit) {
        List<Map<String, Object>> result = new ArrayList<>();
        // Dump the cursor
        try {
            if (resultSet != null) {
                ResultSet rset = (ResultSet) resultSet;
                int row = 0;
                while ((limit < 1 || row++ < limit) && rset.next()) {
                    Map<String, Object> rowData = new LinkedHashMap<>();
                    int colCount = rset.getMetaData().getColumnCount();
                    for (int i = 1; i <= colCount; i++) {
                        rowData.put(rset.getMetaData().getColumnName(i), rset.getObject(i));
                    }
                    result.add(rowData);
                }
            }
        } catch (SQLException e) {
            throw new WMRuntimeException("Failed to process cursor ", e);
        }

        return result;
    }
}
