package com.wavemaker.runtime.data.util;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.Test;

import static org.testng.Assert.*;


public class HQLQueryUtilsTest {

    private static Map<String, String> expressionVsExpectedQuery = new LinkedHashMap<>(10);

    static {
        expressionVsExpectedQuery.put("firstName startsWith 'A'", "firstName like 'A%'");
        expressionVsExpectedQuery.put("firstName endsWith 'a'", "firstName like '%a'");
        expressionVsExpectedQuery.put("firstName containing 'e'", "firstName like '%e%'");
        expressionVsExpectedQuery.put("(firstName like '%e%')","(firstName like '%e%')");
        expressionVsExpectedQuery.put("(id > 15) AND (salary > 1000)", "(id > 15) AND (salary > 1000)");
        expressionVsExpectedQuery.put("( firstName startsWith 'A' ) AND (lastName endsWith 'a') OR (lastName containing 'e')",
                      "( firstName like 'A%' ) AND (lastName like '%a') OR (lastName like '%e%')");
        expressionVsExpectedQuery.put("(firstName endsWith '.') AND (id > 15)","(firstName like '%.') AND (id > 15)");
        expressionVsExpectedQuery.put("firstName startsWith 'startsWith \'a\''","firstName like 'startsWith \'a\'%'");
        expressionVsExpectedQuery.put("firstName endsWith 'b containing \"a\"'","firstName like '%b containing \"a\"'");
        expressionVsExpectedQuery.put("startsWith startsWith 'a'","startsWith like 'a%'");
    }

    @Test
    public void testReplaceExpressionWithHQL() {
        for(Map.Entry<String, String> testCase : expressionVsExpectedQuery.entrySet()) {
            assertEquals(HQLQueryUtils.replaceExpressionWithHQL(testCase.getKey()), testCase.getValue());
        }
    }

}