package com.wavemaker.runtime.data.dao.query.types.wmql;

import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author Sujith Simon
 * Created on : 26/11/18
 */
public class WMQLDefaultTypeHelper implements WMQLTypeHelper {

    @Override
    public JavaType aliasFor(JavaType javaType) {
        // JavaType aliasing is not needed by default.
        return javaType;
    }
}
