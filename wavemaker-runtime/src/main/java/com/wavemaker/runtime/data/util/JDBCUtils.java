/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import com.wavemaker.runtime.data.exception.DataServiceRuntimeException;
import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.classloader.ClassLoaderUtils;
import com.wavemaker.studio.common.util.StringUtils;

public class JDBCUtils {

    private JDBCUtils() {
    }

    public static void loadDriver(String driverClassName) {
        ClassLoaderUtils.loadClass(driverClassName);
    }

    public static Connection getConnection(String url, String username, String password, String driverClassName) {
        try {
            loadDriver(driverClassName);
            return DriverManager.getConnection(url, username, password);
        } catch (SQLException ex) {
            //wrt to MySQL the cause of the SQLException is set to null; the actual exception is set in a cause filed in MySQLException; hence you need to get the message from the sqlexception itself..
            if(ex.getCause() != null) {
                throw new DataServiceRuntimeException(ex.getCause().getMessage(), ex);
            } else if(ex.getMessage() != null) {
                throw new DataServiceRuntimeException(ex.getMessage(), ex);
            }
            throw new DataServiceRuntimeException(ex, MessageResource.DATABASE_CONNECTION_EXCEPTION);
        }
    }

    public static String getMySQLDatabaseName(String connectionUrl) {
        String s = StringUtils.fromFirstOccurrence(connectionUrl, "?", -1);
        int i = s.lastIndexOf("/");
        if (i <= 0 || i == s.length() - 1) {
            return null;
        }
        if (s.charAt(i - 1) == '/') {
            return null;
        }
        return s.substring(i + 1);
    }

}
