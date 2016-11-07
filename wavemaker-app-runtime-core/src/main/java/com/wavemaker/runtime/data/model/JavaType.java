package com.wavemaker.runtime.data.model;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.type.*;
import org.joda.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.wavemaker.studio.common.json.deserializer.WMDateDeSerializer;
import com.wavemaker.studio.common.json.deserializer.WMLocalDateTimeDeSerializer;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 11/2/16
 */
public enum JavaType {

    BYTE(byte.class.getName(), Byte.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return ByteType.INSTANCE.fromString(fromValue.toString());
        }
    },
    SHORT(short.class.getName(), Short.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return ShortType.INSTANCE.fromString(fromValue.toString());
        }
    },
    INTEGER(int.class.getName(), Integer.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return IntegerType.INSTANCE.fromString(fromValue.toString());
        }
    },
    LONG(long.class.getName(), Long.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return LongType.INSTANCE.fromString(fromValue.toString());
        }
    },
    BIG_INTEGER(BigInteger.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return BigIntegerType.INSTANCE.fromString(fromValue.toString());
        }
    },
    FLOAT(float.class.getName(), Float.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return FloatType.INSTANCE.fromString(fromValue.toString());
        }
    },
    DOUBLE(double.class.getName(), Double.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return DoubleType.INSTANCE.fromString(fromValue.toString());
        }
    },
    BIG_DECIMAL(BigDecimal.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return BigDecimalType.INSTANCE.fromString(fromValue.toString());
        }
    },// OR NUMBER
    BOOLEAN(boolean.class.getName(), Boolean.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return BooleanType.INSTANCE.fromString(fromValue.toString());
        }
    },
    YES_OR_NO(boolean.class.getName(), Boolean.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return YesNoType.INSTANCE.fromString(fromValue.toString());
        }
    },
    TRUE_OR_FALSE(boolean.class.getName(), Boolean.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return TrueFalseType.INSTANCE.fromString(fromValue.toString());
        }
    },
    CHARACTER(char.class.getName(), Character.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return CharacterType.INSTANCE.fromString(fromValue.toString());
        }
    },
    STRING(String.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return fromValue.toString();
        }
    },
    TEXT(String.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return TextType.INSTANCE.fromString(fromValue.toString());
        }
    },
    CLOB(String.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return ClobType.INSTANCE.fromString(fromValue.toString());
        }
    },
    BLOB("byte[]") {
        @Override
        public Object convert(final Object fromValue) {
            return BlobType.INSTANCE.fromString(fromValue.toString());
        }
    },
    DATE(Date.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            if (fromValue instanceof Number) {
                return new java.sql.Date(((Number) fromValue).longValue());
            } else {
                return WMDateDeSerializer.getDate(fromValue.toString());
            }
        }
    },
    TIME(Date.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            if (fromValue instanceof Number) {
                return new java.sql.Time(((Number) fromValue).longValue());
            } else {
                return WMDateDeSerializer.getDate((String) fromValue);
            }
        }
    },
    DATETIME(LocalDateTime.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return WMLocalDateTimeDeSerializer.getLocalDateTime((String) fromValue);
        }
    },
    TIMESTAMP(Date.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return new Timestamp(((Number) fromValue).longValue());
        }
    },
    //    CALENDAR(),
//    CALENDAR_DATE(),
//    CURRENCY(),
//    LOCALE(),
//    TIMEZONE(),
    OBJECT(Object.class.getName()) {
        @Override
        public Object convert(final Object fromValue) {
            return fromValue;
        }
    };

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

    JavaType(final String primitiveClassName, final String wrapperClassName) {
        this.primitiveClassName = primitiveClassName;
        this.className = wrapperClassName;
    }

    JavaType(final String className) {
        this(className, className);
    }

    public String getClassName() {
        return this.className;
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

    public abstract Object convert(Object fromValue);

    @JsonCreator
    public static JavaType fromValue(String value) {
        return javaTypeMap.get(value);
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}
