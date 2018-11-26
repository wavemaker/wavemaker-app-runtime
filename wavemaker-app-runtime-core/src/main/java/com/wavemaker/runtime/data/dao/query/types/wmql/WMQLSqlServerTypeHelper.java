package com.wavemaker.runtime.data.dao.query.types.wmql;

import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author Sujith Simon
 * Created on : 22/11/18
 */
public class WMQLSqlServerTypeHelper implements WMQLTypeHelper {


    @Override
    public JavaType aliasFor(JavaType javaType) {

        if (javaType == JavaType.TIME) {
            return JavaType.STRING;
        }

        return javaType;
    }
}
