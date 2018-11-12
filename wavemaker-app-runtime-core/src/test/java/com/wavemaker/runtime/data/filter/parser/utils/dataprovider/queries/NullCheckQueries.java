package com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries;

import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.data.filter.parser.utils.HqlParserTestUtils;

/**
 * @author Sujith Simon
 * Created on : 9/11/18
 */
public class NullCheckQueries {

    private static final List<String> queries = new ArrayList<>();

    static {
        queries.add("(${key} is not null or ${key} != null)");
        queries.add("child.${key} is null and ${key} is not null");
        queries.add("child.grandChild.${key} = null or child.${key} is null");
        queries.add("(${key} is not null ) and (child.grandChild.${key} is null)");
    }

    public static List<String> getQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, queries, false);
    }
}
