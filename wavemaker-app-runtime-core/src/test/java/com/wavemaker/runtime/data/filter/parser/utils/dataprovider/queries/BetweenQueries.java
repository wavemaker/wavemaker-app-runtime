package com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries;

import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.data.filter.parser.utils.HqlParserTestUtils;

/**
 * @author Sujith Simon
 * Created on : 12/11/18
 */
public class BetweenQueries {

    private static final List<String> positiveQueries = new ArrayList<>();
    private static final List<String> negativeQueries = new ArrayList<>();

    static {
        positiveQueries.add("${key} between ${value} and ${value}");
        positiveQueries.add("child.${key} between ${value} and ${value}");
        positiveQueries.add("child.grandChild.${key} between ${value} and ${value}");
        positiveQueries.add("${key} between ${value} and ${value} or child.${key} between ${value} and ${value}");

        negativeQueries.add("${key} between ${value} or ${value}");
        negativeQueries.add("${key} between ${value}, ${value}");
        negativeQueries.add("${key} ${value} and ${value}");
        negativeQueries.add("${key} between ${value} ${value}");
    }

    public static List<String> getPositiveQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, positiveQueries);

    }

    public static List<String> getNegativeQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, negativeQueries);
    }
}
