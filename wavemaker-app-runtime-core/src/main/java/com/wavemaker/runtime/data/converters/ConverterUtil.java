package com.wavemaker.runtime.data.converters;

import org.apache.commons.lang3.math.NumberUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public class ConverterUtil {

    public static Object toLongIfPossible(final Object fromValue) {
        Object value = fromValue;
        if (fromValue instanceof String) {
            if (NumberUtils.isNumber(((String) value))) {
                value = Long.valueOf(((String) value));
            }
        }
        return value;
    }
}
