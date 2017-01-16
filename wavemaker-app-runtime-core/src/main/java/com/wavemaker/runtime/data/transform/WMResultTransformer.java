package com.wavemaker.runtime.data.transform;

import java.util.Map;

import org.hibernate.transform.ResultTransformer;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 17/11/16
 */
public interface WMResultTransformer extends ResultTransformer {

    Object transformFromMap(Map<String, Object> resultMap);

    String aliasToFieldName(String columnName);

    String aliasFromFieldName(String fieldName);
}
