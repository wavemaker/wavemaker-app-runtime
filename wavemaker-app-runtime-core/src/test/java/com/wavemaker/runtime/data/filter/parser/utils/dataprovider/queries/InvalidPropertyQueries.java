package com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries;

import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.data.filter.parser.utils.HqlParserTestUtils;

/**
 * @author Sujith Simon
 * Created on : 12/11/18
 */
public class InvalidPropertyQueries {

    private static final List<String> queries = new ArrayList<>();

    static {
        queries.add("${key}12 = 'string'");
        queries.add("child_${key} = 'string'");
        queries.add("child.grandChild${key} != 'string'");
        queries.add("${key} = 1 or${key}=2");
    }

    public static List<String> getQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, queries, false);
    }

}
