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
package com.wavemaker.runtime.data.filter;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
public class WMQueryFunctionInterceptor implements QueryInterceptor {

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
