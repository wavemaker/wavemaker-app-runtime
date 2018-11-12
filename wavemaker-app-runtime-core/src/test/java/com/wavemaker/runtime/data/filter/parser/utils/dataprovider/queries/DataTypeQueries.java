package com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries;

import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.data.filter.parser.utils.HqlParserTestUtils;

/**
 * @author Sujith Simon
 * Created on : 9/11/18
 */
public class DataTypeQueries {

    private static final List<String> queries = new ArrayList<>();

    static {
        queries.add("(${key} > ${value} and ${key} != ${value})");
        queries.add("child.${key} = ${value} or child.${key} < ${value}");
        queries.add("child.grandChild.${key} >= ${value} or child.grandChild.${key} <= ${value}");
        queries.add("(${key} > ${value}) and (child.grandChild.${key} = ${value})");
    }

    public static List<String> getQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, queries);
    }


}
