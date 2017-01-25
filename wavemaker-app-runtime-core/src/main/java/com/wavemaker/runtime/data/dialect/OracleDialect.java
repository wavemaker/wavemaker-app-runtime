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

import org.hibernate.type.StandardBasicTypes;
import org.hibernate.type.descriptor.sql.CharTypeDescriptor;
import org.hibernate.type.descriptor.sql.SqlTypeDescriptor;

import com.wavemaker.commons.CommonConstants;

/**
 * Created by sunilp on 21/7/15.
 */
public class OracleDialect extends org.hibernate.dialect.OracleDialect {

    public OracleDialect() {
        super();
        registerColumnType(CommonConstants.DATE_TIME_WM_TYPE_CODE, "date");
        registerColumnType( Types.TIMESTAMP, "timestamp" );

        registerHibernateType( CommonConstants.TIMESTAMP_WITH_TIMEZONE_SQL_CODE, StandardBasicTypes.TIMESTAMP.getName() );
        registerHibernateType( CommonConstants.TIMESTAMP_WITH_LOCAL_TIMEZONE_SQL_CODE, StandardBasicTypes.TIMESTAMP.getName() );
    }

    protected SqlTypeDescriptor getSqlTypeDescriptorOverride(int sqlCode) {
        SqlTypeDescriptor sqlTypeDescriptor = super.getSqlTypeDescriptorOverride(sqlCode);
        if(sqlCode == Types.BOOLEAN) {
            sqlTypeDescriptor =  new CharTypeDescriptor();
        }
        return sqlTypeDescriptor;
    }
}
