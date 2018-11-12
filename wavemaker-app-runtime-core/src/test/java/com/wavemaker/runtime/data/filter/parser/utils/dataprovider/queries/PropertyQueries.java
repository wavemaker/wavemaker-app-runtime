package com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Sujith Simon
 * Created on : 12/11/18
 */
public class PropertyQueries {
    private static final List<String> positiveQueries = new ArrayList<>();
    private static final List<String> negativeQueries = new ArrayList<>();

    static {
        positiveQueries.add("child is not null");
        positiveQueries.add("child is not null and child.grandChild is null");
        positiveQueries.add("child.grandChild is not null");
        positiveQueries.add("child is null or child.grandChild is null");

        negativeQueries.add("child > 0");
        negativeQueries.add("child != 123");
        negativeQueries.add("child.grandChild like '%string%'");
        negativeQueries.add("child.grandChild in (123,434,343)");
    }

    public static List<String> getPositiveQueries(Class<?> dataType) {
        return positiveQueries;

    }

    public static List<String> getNegativeQueries(Class<?> dataType) {
        return negativeQueries;
    }
}
