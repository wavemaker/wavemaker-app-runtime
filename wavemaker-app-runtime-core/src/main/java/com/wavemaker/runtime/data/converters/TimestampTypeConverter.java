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
package com.wavemaker.runtime.data.converters;

import java.sql.Timestamp;

import org.hibernate.type.TimestampType;
import org.springframework.util.ClassUtils;
import org.springframework.util.ReflectionUtils;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public class TimestampTypeConverter extends HibernateBackedJavaTypeConverter {

    public static final String ORACLE_SQL_TIMESTAMP = "oracle.sql.TIMESTAMP";

    public TimestampTypeConverter() {
        super(TimestampType.INSTANCE.getJavaTypeDescriptor());
    }

    @Override
    public Object fromString(final String value) {
        final Object numberValue = ConverterUtil.toLongIfPossible(value);

        if (numberValue instanceof Long) {
            return new Timestamp((Long) numberValue);
        } else {
            return super.fromString(value);
        }
    }

    @Override
    public Object fromDbValue(final Object value) {
        Object convertedValue = value;
        if (value != null && ORACLE_SQL_TIMESTAMP.equals(value.getClass().getCanonicalName())) {
            try {
                Class<?> oracleTimestamp = ClassUtils.forName(ORACLE_SQL_TIMESTAMP, Thread.currentThread()
                        .getContextClassLoader());
                convertedValue = ReflectionUtils.invokeMethod(ClassUtils.getMethod(oracleTimestamp, "timestampValue"),
                        value);
            } catch (ClassNotFoundException e) {
                // ignore this exception
            }
        } else {
            convertedValue = super.fromDbValue(value);
        }
        return convertedValue;
    }
}
