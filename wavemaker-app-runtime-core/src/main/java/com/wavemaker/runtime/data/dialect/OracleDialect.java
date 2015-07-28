package com.wavemaker.runtime.data.dialect;

import java.sql.Types;

import org.hibernate.type.StandardBasicTypes;

import com.wavemaker.studio.common.CommonConstants;

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
}
