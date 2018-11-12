package com.wavemaker.runtime.data.filter.parser.utils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.apache.commons.lang.text.StrSubstitutor;

import com.google.common.collect.ImmutableMap;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.FieldsMetadata;

/**
 * @author Sujith Simon
 * Created on : 9/11/18
 */
public interface HqlParserTestUtils {

    static List<String> getNormalizedHql(Class<?> dataType, List<String> queryList) {
        return getNormalizedHql(dataType, queryList, true);
    }

    static List<String> getNormalizedHql(Class<?> dataType, List<String> queryList, boolean includesValues) {
        List<String> queries = new ArrayList<>();
        String fieldName = getFieldName(dataType);
        Object[] values = FieldsMetadata.getSampleValues(dataType);
        for (String query : queryList) {
            if (includesValues) {
                for (Object value : values) {
                    queries.add(StrSubstitutor.replace(query, ImmutableMap.of("key", fieldName,
                            "value", getObjectValue(value))));
                }
            } else {
                queries.add(StrSubstitutor.replace(query, Collections.singletonMap("key", fieldName)));
            }

        }
        return queries;
    }

    static String getFieldName(Class<?> dataType) {
        return "wm" + dataType.getSimpleName();
    }

    static String getObjectValue(Object value) {
        return value instanceof String ? "'" + value + "'" : String.valueOf(value);
    }

}
