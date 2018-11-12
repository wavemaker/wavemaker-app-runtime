package com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries;

import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.data.filter.parser.utils.HqlParserTestUtils;

/**
 * @author Sujith Simon
 * Created on : 9/11/18
 */
public class SyntaxErrorQueries {

    private static final List<String> queries = new ArrayList<>();

    static {
        queries.add("(${key}=string");
        queries.add("child.${key}");
        queries.add("child.grandChild.${key} and child.grandChild.${key}=1");
        queries.add("(${key}>0");
        queries.add("${key}='asd");
    }

    public static List<String> getQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, queries, false);

    }
}
