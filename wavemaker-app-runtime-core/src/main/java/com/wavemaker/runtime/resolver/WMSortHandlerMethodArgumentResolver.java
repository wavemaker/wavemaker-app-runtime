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
package com.wavemaker.runtime.resolver;

import java.util.ArrayList;
import java.util.List;

import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.SortHandlerMethodArgumentResolver;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 16/2/16
 */
public class WMSortHandlerMethodArgumentResolver extends SortHandlerMethodArgumentResolver {

    private static final String DEFAULT_PROPERTY_DELIMITER = ",";
    public static final String DEFAULT_PROPERTY_KEY_VALUE_DELIMITER = " ";

    private String propertyDelimiter = DEFAULT_PROPERTY_DELIMITER;
    private String propertyKeyValueDelimiter = DEFAULT_PROPERTY_KEY_VALUE_DELIMITER;

    @Override
    public Sort resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {

        String[] directionParameter = webRequest.getParameterValues(getSortParameter(parameter));

        if (directionParameter != null && directionParameter.length != 0) {
            return parseParameterIntoSort(directionParameter, propertyDelimiter);
        } else {
            return super.resolveArgument(parameter, mavContainer, webRequest, binderFactory);
        }
    }

    protected Sort parseParameterIntoSort(String[] source, String delimiter) {

        List<Sort.Order> allOrders = new ArrayList<>();

        for (String part : source) {
            if (part == null) {
                continue;
            }
            String[] elements = part.split(delimiter);

            for (String keyValue : elements) {
                if (!StringUtils.hasText(keyValue)) {
                    continue;
                }

                keyValue = keyValue.trim();

                int lastDelimiterIndex = keyValue.lastIndexOf(propertyKeyValueDelimiter);
                String key;
                Sort.Direction direction = null;

                // this case occurs when property is declared without order in sort.
                // eg : sort=employeeId
                if (lastDelimiterIndex == -1) {
                    key = keyValue;
                } else {
                    // this case occurs when property is declared as below
                    // sort=employeeId asc|desc
                    // sort=employee Id asc|desc
                    // sort=employee Id
                    String value = keyValue.substring(lastDelimiterIndex + 1, keyValue.length());
                    direction = Sort.Direction.fromString(value.trim());
                    key = direction == null ? keyValue : keyValue.substring(0, lastDelimiterIndex).trim();
                }

                allOrders.add(new Sort.Order(direction, key));
            }
        }

        return allOrders.isEmpty() ? null : new Sort(allOrders);
    }

    @Override
    public void setPropertyDelimiter(final String propertyDelimiter) {
        this.propertyDelimiter = propertyDelimiter;
    }

    public void setPropertyKeyValueDelimiter(final String propertyKeyValueDelimiter) {
        this.propertyKeyValueDelimiter = propertyKeyValueDelimiter;
    }
}
