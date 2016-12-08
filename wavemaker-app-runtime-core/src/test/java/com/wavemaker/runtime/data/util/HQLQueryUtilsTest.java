package com.wavemaker.runtime.data.util;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.Test;

import static org.testng.Assert.assertEquals;


public class HQLQueryUtilsTest {

    private static Map<String, String> expressionVsExpectedQuery = new LinkedHashMap<>(10);

    static {
        expressionVsExpectedQuery.put("firstName startswith 'A'", "firstName like 'A%'");
        expressionVsExpectedQuery.put("firstName endswith 'a'", "firstName like '%a'");
        expressionVsExpectedQuery.put("firstName containing 'e'", "firstName like '%e%'");
        expressionVsExpectedQuery.put("(firstName like '%e%')","(firstName like '%e%')");
        expressionVsExpectedQuery.put("(id > 15) AND (salary > 1000)", "(id > 15) AND (salary > 1000)");
        expressionVsExpectedQuery.put("( firstName startswith 'A' ) AND (lastName endswith 'a') OR (lastName containing 'e')",
                      "( firstName like 'A%' ) AND (lastName like '%a') OR (lastName like '%e%')");
        expressionVsExpectedQuery.put("(firstName endswith '.') AND (id > 15)","(firstName like '%.') AND (id > 15)");
        expressionVsExpectedQuery.put("firstName endswith 'b containing \"a\"'","firstName like '%b containing \"a\"'");
        expressionVsExpectedQuery.put("startsWith startswith 'a'","startsWith like 'a%'");
        expressionVsExpectedQuery.put("firstname startswith 'E' AND jobTitle endswith 'Manager'","firstname like 'E%'" +
                " AND jobTitle like '%Manager'");
        expressionVsExpectedQuery.put("firstname endswith 'a' OR city endswith 'ton'","firstname like '%a' OR " +
                "city like '%ton'");
        //This case is not supported
        //expressionVsExpectedQuery.put("firstName startswith 'startswith \'a\''","firstName like 'startswith \'a\'%'");
    }

    @Test
    public void testReplaceExpressionWithHQL() {
        for(Map.Entry<String, String> testCase : expressionVsExpectedQuery.entrySet()) {
            assertEquals(HQLQueryUtils.replaceExpressionWithHQL(testCase.getKey()), testCase.getValue());
        }
    }

}