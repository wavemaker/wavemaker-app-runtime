package com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries;

import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.data.filter.parser.utils.HqlParserTestUtils;

/**
 * @author Sujith Simon
 * Created on : 9/11/18
 */
public class SqlInjectionQueries {

    private static final List<String> queires = new ArrayList<>();

    static {
        queires.add("${key}='' or true=true");
        queires.add("${key}='asdf' or 1=1");
        queires.add("${key}=105 OR 1=1");
        queires.add("${key}=123; delete TABLE Employee;");
        queires.add("${key}=''; delete TABLE Employee;");
        queires.add("${key}=2 or 1 is not null");
    }

    public static List<String> getQueries(Class<?> dataType) {
        return HqlParserTestUtils.getNormalizedHql(dataType, queires, false);
    }
}
