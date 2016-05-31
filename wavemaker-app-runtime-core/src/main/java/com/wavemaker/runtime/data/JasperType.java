package com.wavemaker.runtime.data;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joda.time.LocalDateTime;

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
public enum JasperType {

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
    BLOB(Arrays.asList(Byte.class.getName(), byte[].class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.componentColumn(fieldName, Components.image(new ImageExpression(fieldName)));
        }

        @Override
        public Class getJavaClass() {
            return Byte.class;
        }
    },
    DATE(Collections.singletonList(Date.class.getName())) {
        @Override
        public ColumnBuilder getColumnBuilder(String fieldName, String aliasName) {
            return Columns.column(fieldName, new SimpleExpression_date(fieldName));
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
    };

    private static Map<String, JasperType> classNameVsJasperTypesMap = new HashMap<>();


    public static JasperType valueFor(String value) {
        return classNameVsJasperTypesMap.get(value);
    }


    static {
        for (final JasperType jasperType : JasperType.values()) {
            for (String className : jasperType.getClassNames()) {
                classNameVsJasperTypesMap.put(className, jasperType);
            }
        }
    }

    private final List<String> classNames;

    JasperType(final List<String> classNames) {
        this.classNames = classNames;
    }

    public List<String> getClassNames() {
        return classNames;
    }

    public abstract ColumnBuilder getColumnBuilder(String fieldName, String aliasName);

    public abstract Class getJavaClass();

    class ImageExpression extends AbstractSimpleExpression<InputStream> {
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
}
