package com.wavemaker.runtime.export;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.hibernate.Criteria;
import org.hibernate.Session;

import com.wavemaker.runtime.data.util.QueryParser;
import net.sf.dynamicreports.jasper.builder.JasperReportBuilder;
import net.sf.dynamicreports.report.base.expression.AbstractSimpleExpression;
import net.sf.dynamicreports.report.builder.column.Columns;
import net.sf.dynamicreports.report.builder.column.ComponentColumnBuilder;
import net.sf.dynamicreports.report.builder.column.TextColumnBuilder;
import net.sf.dynamicreports.report.builder.component.Components;
import net.sf.dynamicreports.report.builder.datatype.DataTypes;
import net.sf.dynamicreports.report.definition.ReportParameters;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 9/5/16
 */
public class ReportGenerator {


    private Class<?> entityClass;
    private Session session;
    private ExportOptions exportOptions;


    public ReportGenerator(Session session, Class<?> entityClass, ExportOptions exportOptions) {
        this.session = session;
        this.entityClass = entityClass;
        this.exportOptions = exportOptions;
    }

    public JasperReportBuilder generateReport() {
        JasperReportBuilder reportBuilder = new JasperReportBuilder();
        HashMap<String, String> fieldNameVsTypeMap = getFieldNameVsTypeMap();
        reportBuilder.setDataSource(constructList());
        List<String> fieldNames = new ArrayList<>(fieldNameVsTypeMap.keySet());

        for (String fieldName : fieldNames) {
            String typeClassName = fieldNameVsTypeMap.get(fieldName);
            if ("Integer".equalsIgnoreCase(typeClassName)) {
//                    any styles can be applied here.
                TextColumnBuilder<Integer> numCol = Columns.column(fieldName, fieldName, DataTypes.integerType());
                reportBuilder.addColumn(numCol);
            } else if ("String".equalsIgnoreCase(typeClassName)) {
                TextColumnBuilder<String> stringCol = Columns.column(fieldName, fieldName, DataTypes.stringType());
                reportBuilder.addColumn(stringCol);
            } else if ("Date".equalsIgnoreCase(typeClassName)) {
                TextColumnBuilder<Date> dateCol = Columns.column(fieldName, fieldName, DataTypes.dateType());
                reportBuilder.addColumn(dateCol);
            } else if ("Byte[]".equalsIgnoreCase(typeClassName)) {
                reportBuilder.addField(fieldName, Object.class);
                ComponentColumnBuilder imageColumn = Columns.componentColumn(fieldName, Components.image(new ImageExpression(fieldName)));
                reportBuilder.addColumn(imageColumn);
            } else if ("Double".equalsIgnoreCase(typeClassName)) {
                TextColumnBuilder<Double> doubleCol = Columns.column(fieldName, fieldName, DataTypes.doubleType());
                reportBuilder.addColumn(doubleCol);
            } else if ("BigInteger".equalsIgnoreCase(typeClassName)) {
                TextColumnBuilder<BigInteger> bigIntCol = Columns.column(fieldName, fieldName, DataTypes.bigIntegerType());
                reportBuilder.addColumn(bigIntCol);
            } else if ("BigDecimal".equalsIgnoreCase(typeClassName)) {
                TextColumnBuilder<BigDecimal> bigDecimal = Columns.column(fieldName, fieldName, DataTypes.bigDecimalType());
                reportBuilder.addColumn(bigDecimal);
            } else {
                TextColumnBuilder<String> defaultCol = Columns.column(fieldName, fieldName, DataTypes.stringType());
                reportBuilder.addColumn(defaultCol);
            }
        }
        return reportBuilder;
    }

    private List constructList() {
        Criteria criteria = session.createCriteria(entityClass);
        QueryParser queryParser = new QueryParser(entityClass);
        String query = exportOptions.getQuery();
        if (StringUtils.isNotBlank(query)) {
            criteria.add(queryParser.parse(query));
        }
        return criteria.list();
    }

    private HashMap<String, String> getFieldNameVsTypeMap() {
        HashMap<String, String> fieldNameVsTypeMap = new HashMap<>();
        for (Field field : entityClass.getDeclaredFields()) {
            fieldNameVsTypeMap.put(field.getName(), field.getType().getSimpleName());
        }
        return fieldNameVsTypeMap;
    }

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
}
