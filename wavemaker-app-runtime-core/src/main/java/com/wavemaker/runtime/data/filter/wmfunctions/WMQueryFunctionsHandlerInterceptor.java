/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.filter.wmfunctions;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.wavemaker.runtime.data.filter.QueryInterceptor;
import com.wavemaker.runtime.data.filter.WMQueryInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @author Ravali Koppaka
 * @since 29/12/16
 */

/**
 * @deprecated - WMHQL functions are not longer supported. This class will be removed
 * once the WMHQL functions are not included in the HTTP requests containing queries.
 */
@Deprecated
public class WMQueryFunctionsHandlerInterceptor implements QueryInterceptor {

    private static final int FUNCTION_NAME_GROUP = 1;
    private static final int VALUE_GROUP = 2;

    private static final String functionsPattern = "wm_(" + pipeSeparatedFunctions() + ")\\('([^']+)'\\)";
    private static final Pattern pattern = Pattern.compile(functionsPattern, Pattern.CASE_INSENSITIVE);

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

    @Override
    public void intercept(final WMQueryInfo queryInfo, Class<?> entity) {
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
}
