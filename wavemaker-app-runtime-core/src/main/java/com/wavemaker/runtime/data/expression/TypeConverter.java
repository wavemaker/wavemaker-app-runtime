package com.wavemaker.runtime.data.expression;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 15/2/16
 */
public interface TypeConverter {

    public Object toJavaType(final Object value);

}
