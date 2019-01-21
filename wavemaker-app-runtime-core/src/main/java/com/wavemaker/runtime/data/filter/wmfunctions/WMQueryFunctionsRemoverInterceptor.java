package com.wavemaker.runtime.data.filter.wmfunctions;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.wavemaker.runtime.data.filter.QueryInterceptor;
import com.wavemaker.runtime.data.filter.WMQueryInfo;

/**
 * @author Sujith Simon
 * Created on : 21/1/19
 */

/**
 * @deprecated - WMHQL functions are not longer supported. This class will be removed
 * once the WMHQL functions are not included in the HTTP requests containing queries.
 */
public class WMQueryFunctionsRemoverInterceptor implements QueryInterceptor {

    private static final String functionsPattern = "wm_.*?\\((.*?)\\)";
    private static final Pattern pattern = Pattern.compile(functionsPattern, Pattern.CASE_INSENSITIVE);

    @Override
    public void intercept(final WMQueryInfo queryInfo, Class<?> entity) {

        final Matcher matcher = pattern.matcher(queryInfo.getQuery());
        StringBuffer newQuerySB = new StringBuffer();

        while (matcher.find()) {
            matcher.appendReplacement(newQuerySB, matcher.group(1));

        }
        matcher.appendTail(newQuerySB);
        queryInfo.setQuery(newQuerySB.toString());
    }

}
