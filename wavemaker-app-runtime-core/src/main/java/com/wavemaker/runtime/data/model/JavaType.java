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
package com.wavemaker.runtime.data.model;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.type.*;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.converters.BlobTypeConverter;
import com.wavemaker.runtime.data.converters.DateTimeConverter;
import com.wavemaker.runtime.data.converters.DateTypeConverter;
import com.wavemaker.runtime.data.converters.HibernateBackedJavaTypeConverter;
import com.wavemaker.runtime.data.converters.JavaTypeConverter;
import com.wavemaker.runtime.data.converters.ObjectTypeConverter;
import com.wavemaker.runtime.data.converters.StringTypeConverter;
import com.wavemaker.runtime.data.converters.TimeTypeConverter;
import com.wavemaker.runtime.data.converters.TimestampTypeConverter;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 11/2/16
 */
public enum JavaType {

    BYTE(byte.class.getName(), Byte.class.getName(),
            new HibernateBackedJavaTypeConverter(ByteType.INSTANCE.getJavaTypeDescriptor())),
    SHORT(short.class.getName(), Short.class.getName(),
            new HibernateBackedJavaTypeConverter(ShortType.INSTANCE.getJavaTypeDescriptor())),
    INTEGER(int.class.getName(), Integer.class.getName(),
            new HibernateBackedJavaTypeConverter(IntegerType.INSTANCE.getJavaTypeDescriptor())),
    LONG(long.class.getName(), Long.class.getName(),
            new HibernateBackedJavaTypeConverter(LongType.INSTANCE.getJavaTypeDescriptor())),
    BIG_INTEGER(BigInteger.class.getName(),
            new HibernateBackedJavaTypeConverter(BigIntegerType.INSTANCE.getJavaTypeDescriptor())),
    FLOAT(float.class.getName(), Float.class.getName(),
            new HibernateBackedJavaTypeConverter(FloatType.INSTANCE.getJavaTypeDescriptor())),
    DOUBLE(double.class.getName(), Double.class.getName(),
            new HibernateBackedJavaTypeConverter(DoubleType.INSTANCE.getJavaTypeDescriptor())),
    BIG_DECIMAL(BigDecimal.class.getName(),
            new HibernateBackedJavaTypeConverter(BigDecimalType.INSTANCE.getJavaTypeDescriptor())),// OR NUMBER
    BOOLEAN(boolean.class.getName(), Boolean.class.getName(),
            new HibernateBackedJavaTypeConverter(BooleanType.INSTANCE.getJavaTypeDescriptor())),
    YES_OR_NO(boolean.class.getName(), Boolean.class.getName(),
            new HibernateBackedJavaTypeConverter(YesNoType.INSTANCE.getJavaTypeDescriptor())),
    TRUE_OR_FALSE(boolean.class.getName(), Boolean.class.getName(),
            new HibernateBackedJavaTypeConverter(TrueFalseType.INSTANCE.getJavaTypeDescriptor())),
    CHARACTER(char.class.getName(), Character.class.getName(),
            new HibernateBackedJavaTypeConverter(CharacterType.INSTANCE.getJavaTypeDescriptor())),
    STRING(String.class.getName(), new StringTypeConverter()),
    TEXT(String.class.getName(), new StringTypeConverter()),
    CLOB(String.class.getName(), new StringTypeConverter()),
    BLOB("byte[]", new BlobTypeConverter()) {
        @Override
        public Class<?> getClassType() {
            return byte[].class;
        }
    },
    DATE(Date.class.getName(), new DateTypeConverter()),
    TIME(Time.class.getName(), new TimeTypeConverter()),
    DATETIME(LocalDateTime.class.getName(), new DateTimeConverter()),
    TIMESTAMP(Timestamp.class.getName(), new TimestampTypeConverter()),
    CURSOR(Object.class.getName(), new ObjectTypeConverter());
    //    CALENDAR(),
//    CALENDAR_DATE(),
//    CURRENCY(),
//    LOCALE(),
//    TIMEZONE(),

    private static Map<String, JavaType> javaTypeMap = new HashMap<>();

    private static List<JavaType> integerTypes = Arrays.asList(JavaType.SHORT,
            JavaType.INTEGER,
            JavaType.LONG,
            JavaType.BIG_INTEGER);

    private static List<JavaType> decimalTypes = Arrays.asList(JavaType.FLOAT,
            JavaType.DOUBLE,
            JavaType.BIG_DECIMAL);

    private static List<JavaType> numericTypes = new ArrayList<>();

    static {
        for (final JavaType javaType : JavaType.values()) {
            javaTypeMap.put(javaType.toValue(), javaType);
        }

        numericTypes.addAll(integerTypes);
        numericTypes.addAll(decimalTypes);
    }

    private final String className;
    private final String primitiveClassName;

    private final JavaTypeConverter converter;

    JavaType(final String primitiveClassName, final String wrapperClassName, final JavaTypeConverter converter) {
        this.primitiveClassName = primitiveClassName;
        this.className = wrapperClassName;
        this.converter = converter;
    }

    JavaType(final String className, final JavaTypeConverter converter) {
        this(className, className, converter);
    }

    public String getClassName() {
        return this.className;
    }

    public Class<?> getClassType() {
        try {
            return Class.forName(getClassName());
        } catch (ClassNotFoundException e) {
            throw new WMRuntimeException(e);
        }
    }

    public String getPrimitiveClassName() {
        return primitiveClassName;
    }

    public static List<JavaType> integerTypes() {
        return integerTypes;
    }

    public static List<JavaType> decimalTypes() {
        return decimalTypes;
    }

    public static List<JavaType> numericTypes() {
        return numericTypes;
    }

    public boolean isNumericType() {
        return numericTypes().contains(this);
    }

    public boolean isDecimalType() {
        return decimalTypes().contains(this);
    }

    public boolean isIntegerType() {
        return integerTypes().contains(this);
    }

    public Object fromDbValue(Object fromValue) {
        return converter.fromDbValue(fromValue);
    }

    public Object fromString(String fromValue) {
        return converter.fromString(fromValue);
    }

    public Object toDbValue(Object fromValue) {
        // handle clob, text properly
        return converter.toDbValue(fromValue, getClassType());
    }

    @JsonCreator
    public static JavaType fromValue(String value) {
        return javaTypeMap.get(value);
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}
