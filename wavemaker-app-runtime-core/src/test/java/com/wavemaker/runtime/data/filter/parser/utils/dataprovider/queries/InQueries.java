package com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries;

import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.data.filter.parser.utils.HqlParserTestUtils;

/**
 * @author Sujith Simon
 * Created on : 12/11/18
 */
public class InQueries {
    private static final List<String> positiveQueries = new ArrayList<>();
    private static final List<String> negativeQueries = new ArrayList<>();

    static {
        positiveQueries.add("${key} in (${value},${value})");
        positiveQueries.add("child.${key} in (${value},${value})");
        positiveQueries.add("child.grandChild.${key} in (${value},${value},${value},${value})");
        positiveQueries.add("${key} IN (${value},${value}) or child.${key} in (${value},${value})");

        negativeQueries.add("${key} in ${value},${value}");
        negativeQueries.add("child.${key} (${value},${value})");
        negativeQueries.add("child.grandChild.${key} ni (${value},${value},${value},${value})");
        negativeQueries.add("${key} in (${value},${value} ${value},${value})");
    }

    public static List<String> getPositiveQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, positiveQueries);
    }

    public static List<String> getNegativeQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, negativeQueries);
    }


}
