package com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries;

import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.data.filter.parser.utils.HqlParserTestUtils;

/**
 * @author Sujith Simon
 * Created on : 12/11/18
 */
public class NestedBracesQueries {
    private static final List<String> positiveQueries = new ArrayList<>();
    private static final List<String> negativeQueries = new ArrayList<>();

    static {
        positiveQueries.add("(${key}=${value})");
        positiveQueries.add("((child.${key} = ${value}) or ${key} != ${value})");
        positiveQueries.add("(${key}=${value}) or (child.grandChild.${key}=${value} or (child.${key}=${value} and (${key}=${value})))");
        positiveQueries.add("(${key} >= ${value} or child.${key} is not null)");

        negativeQueries.add("(${key} != ${value} ${key} is not null");
        negativeQueries.add("(${key} in (${value}, ${value})");
        negativeQueries.add("(${key} = ( ${value} ))");
        negativeQueries.add("(${key} = ${value} or ${key} = ) ${value}");
    }

    public static List<String> getPositiveQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, positiveQueries);

    }

    public static List<String> getNegativeQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, negativeQueries);
    }
}
