package com.wavemaker.runtime.data.dao.query.types.wmql;

import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author Sujith Simon
 * Created on : 22/11/18
 */
public interface WMQLTypeHelper {

    JavaType aliasFor(JavaType javaType);
}
