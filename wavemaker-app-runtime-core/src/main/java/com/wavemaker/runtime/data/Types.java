package com.wavemaker.runtime.data;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.lang.reflect.Constructor;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.joda.time.LocalDateTime;

import com.wavemaker.runtime.data.util.QueryParserConstants;
import com.wavemaker.studio.common.WMRuntimeException;
import net.sf.dynamicreports.report.base.expression.AbstractSimpleExpression;
import net.sf.dynamicreports.report.builder.column.ColumnBuilder;
import net.sf.dynamicreports.report.builder.column.Columns;
import net.sf.dynamicreports.report.builder.component.Components;
import net.sf.dynamicreports.report.builder.datatype.DataTypes;
import net.sf.dynamicreports.report.definition.ReportParameters;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 26/5/16
 */
public enum Types {

    BYTE(Arrays.asList(Byte.class.getName(), byte.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.byteType());
        }

        @Override
        public Class getJavaClass() {
            return Byte.class;
        }
    },
    SHORT(Arrays.asList(Short.class.getName(), short.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.shortType());
        }

        @Override
        public Class getJavaClass() {
            return Short.class;
        }
    },
    INTEGER(Arrays.asList(Integer.class.getName(), int.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.integerType());
        }

        @Override
        public Class getJavaClass() {
            return Integer.class;
        }
    },
    LONG(Arrays.asList(Long.class.getName(), long.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.longType());
        }

        @Override
        public Class getJavaClass() {
            return Long.class;
        }
    },
    BIG_INTEGER(Collections.singletonList(BigInteger.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.bigIntegerType());
        }

        @Override
        public Class getJavaClass() {
            return BigInteger.class;
        }
    },
    FLOAT(Arrays.asList(Float.class.getName(), float.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.floatType());
        }

        @Override
        public Class getJavaClass() {
            return Float.class;
        }
    },
    DOUBLE(Arrays.asList(Double.class.getName(), double.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.doubleType());
        }

        @Override
        public Class getJavaClass() {
            return Double.class;
        }
    },
    BIG_DECIMAL(Collections.singletonList(BigDecimal.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.bigDecimalType());
        }

        @Override
        public Class getJavaClass() {
            return BigDecimal.class;
        }
    },
    BOOLEAN(Arrays.asList(Boolean.class.getName(), boolean.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.booleanType());
        }

        @Override
        public Class getJavaClass() {
            return Boolean.class;
        }
    },
    CHARACTER(Arrays.asList(Character.class.getName(), char.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.characterType());
        }

        @Override
        public Object toJavaType(String value) {
            Object castedValue = value;
            if (isNotBlankType(value)) {
                castedValue = value.charAt(0);
            }
            return castedValue;
        }

        @Override
        public Class getJavaClass() {
            return Character.class;
        }
    },
    STRING(Collections.singletonList(String.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, fieldName, DataTypes.stringType());
        }

        @Override
        public Class getJavaClass() {
            return String.class;
        }
    },
    BLOB(Arrays.asList(Byte[].class.getName(), byte[].class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.componentColumn(fieldName, Components.image(new ImageExpression(fieldName)));
        }

        @Override
        public Class getJavaClass() {
            return Byte[].class;
        }
    },
    DATE(Collections.singletonList(Date.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, new SimpleExpression_date(fieldName));
        }

        @Override
        public Object toJavaType(String value) {
            Object castedValue = value;
            if (isNotBlankType(value)) {
                List<SimpleDateFormat> formats = new LinkedList<>();
                //        TODO add other formats
                formats.add(new SimpleDateFormat("yyyy-MM-dd"));
                formats.add(new SimpleDateFormat("HH:mm:ss"));
                formats.add(new TimestampFormat());
                for (SimpleDateFormat format : formats) {
                    try {
                        castedValue = format.parse(value);
                    } catch (ParseException ex) {
//                do nothing
                    }
                }
                if (castedValue == null) {
                    castedValue = new Date(Long.parseLong(value));
                }
            }
            return castedValue;
        }

        @Override
        public Class getJavaClass() {
            return Date.class;
        }
    },
    DATETIME(Collections.singletonList(LocalDateTime.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {

            return Columns.column(fieldName, new SimpleExpression_datetime(fieldName));
        }

        @Override
        public Object toJavaType(String value) {
            Object castedValue = value;
            if (isNotBlankType(value)) {
                castedValue = LocalDateTime.parse(value);
            }
            return castedValue;
        }

        @Override
        public Class getJavaClass() {
            return LocalDateTime.class;
        }
    },
    OBJECT(Collections.singletonList(Object.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            throw new WMRuntimeException("Object typed column data cannot be exported");
        }

        @Override
        public Class getJavaClass() {
            return Object.class;
        }
    },
    LIST(Collections.singletonList(List.class.getName())){
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            throw new WMRuntimeException("List typed column data cannot be exported");
        }

        @Override
        public Class getJavaClass() {
            return List.class;
        }
    };

    private static Map<String, Types> classNameVsTypesMap = new HashMap<>();


    public static Types valueFor(String value) {
        return classNameVsTypesMap.get(value);
    }


    static {
        for (final Types types : Types.values()) {
            for (String className : types.getClassNames()) {
                classNameVsTypesMap.put(className, types);
            }
        }
    }

    private final List<String> classNames;

    Types(final List<String> classNames) {
        this.classNames = classNames;
    }

    public List<String> getClassNames() {
        return classNames;
    }

    public abstract ColumnBuilder getColumnBuilder(String fieldName, String aliasName);

    public abstract Class getJavaClass();


    public Object toJavaType(String value) {
        Object castedValue = value;
        if (isNotBlankType(value)) {
            try {
                Class<?> typeClass = getJavaClass();
                Constructor<?> cons = typeClass.getConstructor(new Class<?>[]{String.class});
                castedValue = cons.newInstance(value);
            } catch (Exception e) {
                throw new WMRuntimeException("Exception while casting the operand", e);
            }
        }
        return castedValue;
    }

    private static boolean isNotBlankType(String value) {
        return !QueryParserConstants.NULL.equals(value) && !QueryParserConstants.NOTNULL
                .equals(value) && !QueryParserConstants.EMPTY.equals(value) && !QueryParserConstants.NULL_OR_EMPTY
                .equals(value);
    }

    private class ImageExpression extends AbstractSimpleExpression<InputStream> {
        private static final long serialVersionUID = 1L;

        private String fieldName;

        public ImageExpression(String fieldName) {
            this.fieldName = fieldName;
        }

        public InputStream evaluate(ReportParameters reportParameters) {
            return new ByteArrayInputStream((byte[]) reportParameters.getValue(fieldName));
        }
    }

    private class SimpleExpression_datetime extends AbstractSimpleExpression<String> {
        private static final long serialVersionUID = 1L;

        private String fieldName;

        public SimpleExpression_datetime(String fieldName) {
            this.fieldName = fieldName;
        }

        @Override
        public String evaluate(ReportParameters reportParameters) {
            LocalDateTime localDateTime = reportParameters.getValue(fieldName);
            return localDateTime.toString();
        }
    }

    private class SimpleExpression_date extends AbstractSimpleExpression<String> {
        private static final long serialVersionUID = 1L;

        private String fieldName;

        public SimpleExpression_date(String fieldName) {
            this.fieldName = fieldName;
        }

        @Override
        public String evaluate(ReportParameters reportParameters) {
            Date date = reportParameters.getValue(fieldName);
            return date.toString();
        }
    }

    private static class TimestampFormat extends SimpleDateFormat {

        @Override
        public Date parse(final String source) throws ParseException {
            try {
                return new Date(Long.valueOf(source));
            } catch (NumberFormatException e) {
                throw new ParseException("Cannot convert to Date from given timestamp:" + source, 0);
            }
        }
    }
}
