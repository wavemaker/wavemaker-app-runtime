package com.wavemaker.runtime.data.filter;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @author Ravali Koppaka
 * @since 29/12/16
 */
public class WMQueryFunctionInterceptor implements QueryInterceptor {

    private static final int FUNCTION_NAME_GROUP = 1;
    private static final int VALUE_GROUP = 2;

    private static final String functionsPattern = "wm_(" + pipeSeparatedFunctions() + ")\\('([^']+)'\\)";
    private static final Pattern pattern = Pattern.compile(functionsPattern, Pattern.CASE_INSENSITIVE);

    @Override
    public void intercept(final WMQueryInfo queryInfo) {
        final Matcher matcher = pattern.matcher(queryInfo.getQuery());
        StringBuffer newQuerySB = new StringBuffer();

        int parameterIndex = 1;
        while (matcher.find()) {
            final WMHqlFunction function = WMHqlFunction.valueOf(matcher.group(FUNCTION_NAME_GROUP).toUpperCase());

            String parameterName = "param" + (parameterIndex++);

            matcher.appendReplacement(newQuerySB, ":" + parameterName);
            queryInfo.addParameter(parameterName, function.convertValue(matcher.group(VALUE_GROUP)));
        }
        matcher.appendTail(newQuerySB);
        queryInfo.setQuery(newQuerySB.toString());
    }

    private static String pipeSeparatedFunctions() {
        StringBuilder sb = new StringBuilder();
        final WMHqlFunction[] values = WMHqlFunction.values();
        for (int i = 0, valuesLength = values.length; i < valuesLength; i++) {
            final WMHqlFunction function = values[i];

            sb.append(function.name());

            if (i < valuesLength - 1) {
                sb.append("|");
            }
        }
        return sb.toString();
    }
}
