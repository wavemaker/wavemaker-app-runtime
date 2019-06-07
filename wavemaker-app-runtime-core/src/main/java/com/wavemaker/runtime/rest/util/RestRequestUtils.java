package com.wavemaker.runtime.rest.util;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.apache.commons.lang3.StringUtils;

import com.wavemaker.runtime.data.replacers.providers.VariableType;
import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.tools.apidocs.tools.core.model.VendorUtils;
import com.wavemaker.tools.apidocs.tools.core.model.parameters.Parameter;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 31/5/19
 */
public class RestRequestUtils {

    private static final List<String> VAR_TYPES = Arrays.asList(VariableType.SERVER.name(),
            VariableType.APP_ENVIRONMENT.name());

    public static Optional<String> findVariableValue(Parameter parameter) {
        final String variableType = (String) VendorUtils.getWMExtension(parameter, RestConstants.VARIABLE_TYPE);
        final String variableValue = (String) VendorUtils.getWMExtension(parameter, RestConstants.VARIABLE_KEY);
        if (StringUtils.isNotBlank(variableType) && StringUtils.isNotBlank(variableValue)) {
            final String value = VariableType.valueOf(variableType.toUpperCase()).getValue(variableValue, String.class);
            return Optional.ofNullable(value);
        }

        return Optional.empty();
    }

    public static boolean isVariableDefined(Parameter parameter) {
        final String variableType = (String) VendorUtils.getWMExtension(parameter, RestConstants.VARIABLE_TYPE);
        final String variableValue = (String) VendorUtils.getWMExtension(parameter, RestConstants.VARIABLE_KEY);
        return StringUtils.isNotBlank(variableType) && VAR_TYPES.contains(variableType) && StringUtils
                .isNotBlank(variableValue);
    }
}
