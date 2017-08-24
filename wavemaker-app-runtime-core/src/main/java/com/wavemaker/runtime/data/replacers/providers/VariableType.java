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
package com.wavemaker.runtime.data.replacers.providers;

import java.util.Arrays;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.wavemaker.commons.util.Tuple;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.util.JavaTypeUtils;
import com.wavemaker.runtime.system.AppEnvironmentVariableValueProvider;
import com.wavemaker.runtime.system.ServerVariableValueProvider;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 23/6/16
 */
public enum VariableType {
    PROMPT {
        @Override
        public boolean isVariable() {
            return false;
        }

        @Override
        public Object getValue(String variableName) {
            return null;
        }
    },
    SERVER {
        @Override
        public Object getValue(String variableName) {
            final ServerVariableValueProvider provider = WMAppContext.getInstance()
                    .getSpringBean(ServerVariableValueProvider.class);
            return provider.getValue(variableName);
        }
    },
    APP_ENVIRONMENT {
        @Override
        public Object getValue(String variableName) {
            final AppEnvironmentVariableValueProvider provider = WMAppContext.getInstance()
                    .getSpringBean(AppEnvironmentVariableValueProvider.class);
            return provider.getValue(variableName);
        }
    };


    private static final Pattern variablePattern;
    private static final Map<String, VariableType> prefixVsType;

    static {
        final String typePrefixes = Arrays.stream(VariableType.values())
                .filter(VariableType::isVariable)
                .map(VariableType::name)
                .reduce((r, e) -> r + "|" + e)
                .get();
        variablePattern = Pattern.compile("(" + typePrefixes + ")__(.+)__.+");

        prefixVsType = Arrays.stream(VariableType.values())
                .filter(VariableType::isVariable)
                .collect(Collectors.toMap(VariableType::name, variableType -> variableType));
    }

    private static final int PREFIX_GROUP = 1;
    private static final int VARIABLE_NAME_GROUP = 2;

    public boolean isVariable() {
        return true;
    }

    public String toQueryParam(String variableName, String parameterName) {
        return name() + "__" + variableName + "__" + parameterName;
    }

    public static Tuple.Two<VariableType, String> fromVariableName(String name) {
        VariableType type = VariableType.PROMPT;
        String variableName = name;

        final Matcher matcher = variablePattern.matcher(name);
        if (matcher.find()) {
            type = prefixVsType.get(matcher.group(PREFIX_GROUP));
            variableName = matcher.group(VARIABLE_NAME_GROUP);
        }

        return new Tuple.Two<>(type, variableName);
    }

    @SuppressWarnings("unchecked")
    public <T> T getValue(String variableName, Class<T> requiredType) {
        return (T) JavaTypeUtils.convert(requiredType.getCanonicalName(), getValue(variableName));
    }

    public abstract Object getValue(String variableName);
}
