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
package com.wavemaker.runtime.data.converters;

import java.sql.Timestamp;
import java.util.Date;

import org.joda.time.LocalDateTime;

import com.wavemaker.commons.json.deserializer.WMLocalDateTimeDeSerializer;
import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/1/17
 */
public class DateTimeConverter implements JavaTypeConverter {
    @Override
    public Object fromString(final String value) {
        return WMLocalDateTimeDeSerializer.getLocalDateTime(value);
    }

    @Override
    public Object fromDbValue(final Object fromValue) {
        if (fromValue == null) {
            return null;
        }
        if (Timestamp.class.isInstance(fromValue)) {
            Timestamp timestamp = ((Timestamp) fromValue);
            Date date = new Date(timestamp.getTime());
            return LocalDateTime.fromDateFields(date);
        }
        if (Date.class.isInstance(fromValue)) {
            return LocalDateTime.fromDateFields(((Date) fromValue));
        }
        return WMLocalDateTimeDeSerializer.getLocalDateTime(String.valueOf(fromValue));
    }

    @Override
    public Object toDbValue(final Object value, final Class<?> toType) {
        if (value instanceof LocalDateTime) {
            Timestamp timeStamp = Timestamp.valueOf(((LocalDateTime) value).toString("yyyy-MM-dd HH:mm:ss"));
            return JavaType.TIMESTAMP.toDbValue(timeStamp);
        }
        return value;
    }
}
