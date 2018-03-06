/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.filter;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.wavemaker.runtime.data.expression.Type;

/**
 * @author Ravali Koppaka
 * @since 29/12/16
 */
public class LegacyQueryFilterInterceptor implements QueryInterceptor {

    private static final String LEGACY_QUERY_EXPRESSION = "([\\w]+)[\\s]+(startswith|endswith|containing)[\\s][\"']([^']+)+([\"'])";
    private static Pattern legacyQueryPattern = Pattern.compile(LEGACY_QUERY_EXPRESSION);

    private static final String WILDCARD_ENTRY = "%";

    private static final byte FIELD_NAME = 1;
    private static final byte EXPRESSION = 2;
    private static final byte VALUE = 3;

    @Override
    public void intercept(final WMQueryInfo queryInfo) {
        queryInfo.setQuery(replaceExpressionWithHQL(queryInfo.getQuery()));
    }

    static String replaceExpressionWithHQL(String query) {
        Matcher matcher = legacyQueryPattern.matcher(query);
        StringBuffer hqlQuery = new StringBuffer();
        while (matcher.find()) {
            String value = "";
            switch (Type.valueFor(matcher.group(EXPRESSION))) {
                case STARTING_WITH:
                    value = matcher.group(VALUE) + WILDCARD_ENTRY;
                    break;
                case ENDING_WITH:
                    value = WILDCARD_ENTRY + matcher.group(VALUE);
                    break;
                case CONTAINING:
                    value = WILDCARD_ENTRY + matcher.group(VALUE) + WILDCARD_ENTRY;
                    break;
                default:
            }
            matcher.appendReplacement(hqlQuery, matcher.group(FIELD_NAME) + " like " + "'" + value + "'");
        }
        matcher.appendTail(hqlQuery);
        return hqlQuery.toString();
    }
}
