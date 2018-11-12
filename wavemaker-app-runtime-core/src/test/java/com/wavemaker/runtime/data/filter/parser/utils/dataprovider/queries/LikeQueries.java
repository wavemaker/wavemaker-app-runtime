package com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries;

import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.data.filter.parser.utils.HqlParserTestUtils;

/**
 * @author Sujith Simon
 * Created on : 9/11/18
 */
public class LikeQueries {

    private static final List<String> positiveQueries = new ArrayList<>();
    private static final List<String> negativeQueries = new ArrayList<>();

    static {
        positiveQueries.add("${key} like '%string%'");
        positiveQueries.add("child.${key} like '%string'");
        positiveQueries.add("child.grandChild.${key} like 'string%string'");
        positiveQueries.add("${key} like '%string' or child.${key} like '%string'");

        negativeQueries.add("${key} like like '%string%'");
        negativeQueries.add("child.${key} like 123 ");
        negativeQueries.add("child.grandChild.${key} like 'string% ");
        negativeQueries.add("${key} like '%string%' or '%string%' ");
    }

    public static List<String> getPositiveQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, positiveQueries, false);
    }

    public static List<String> getNegativeQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, negativeQueries, false);
    }


}
