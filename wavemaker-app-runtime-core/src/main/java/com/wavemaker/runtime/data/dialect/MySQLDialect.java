/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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
package com.wavemaker.runtime.data.dialect;

import java.sql.Types;

import org.hibernate.dialect.MySQL5Dialect;
import org.hibernate.dialect.function.NoArgSQLFunction;
import org.hibernate.type.StringType;

import com.wavemaker.commons.CommonConstants;

/**
 * @author Simon Toens
 */
public class MySQLDialect extends MySQL5Dialect {


    public MySQLDialect() {
        super();
        registerFunction("uuid", new NoArgSQLFunction("uuid", StringType.INSTANCE));

        //as hibernate timestamp is mapping to sql datetime in mysql,So forcing hibernate timestamp to map sql timestamp.
        registerColumnType(Types.TIMESTAMP, "timestamp");
        registerColumnType(CommonConstants.DATE_TIME_WM_TYPE_CODE, "datetime");
    }

}
