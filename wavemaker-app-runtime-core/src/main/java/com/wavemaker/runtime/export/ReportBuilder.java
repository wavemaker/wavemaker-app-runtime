package com.wavemaker.runtime.export;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import org.hibernate.Criteria;
import org.hibernate.Session;
import org.hibernate.criterion.ProjectionList;
import org.hibernate.criterion.Projections;
import org.hibernate.engine.spi.LoadQueryInfluencers;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.internal.CriteriaImpl;
import org.hibernate.internal.SessionImpl;
import org.hibernate.jdbc.Work;
import org.hibernate.loader.OuterJoinLoader;
import org.hibernate.loader.criteria.CriteriaLoader;
import org.hibernate.persister.entity.OuterJoinLoadable;
import org.hibernate.transform.Transformers;

import com.wavemaker.studio.common.WMRuntimeException;
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
public class ReportBuilder {


    private Class<?> entityClass;
    private Session session;
    private ExportOptions exportOptions;


    public ReportBuilder(Session session, Class<?> entityClass, ExportOptions exportOptions) {
        this.session = session;
        this.entityClass = entityClass;
        this.exportOptions = exportOptions;
    }

    public JasperReportBuilder build() {
        final JasperReportBuilder[] jasperReportBuilder = new JasperReportBuilder[]{null};
        session.doWork(new Work() {
            @Override
            public void execute(Connection connection) throws SQLException {
                jasperReportBuilder[0] = generateReport(connection);
            }
        });
        return jasperReportBuilder[0];
    }

    private JasperReportBuilder generateReport(Connection connection) {
        JasperReportBuilder reportBuilder = new JasperReportBuilder();
        HashMap<String, String> fieldNameVsTypeMap = getFieldNameVsTypeMap();

        reportBuilder.setDataSource(constructSql(), connection);
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

    private String constructSql() {
        Criteria criteria = session.createCriteria(entityClass);
        String sql = getGeneratedQueryString(criteria);
        System.out.println(sql);
        return sql;
    }

    //hack written to get native sql from criteria.
    private String getGeneratedQueryString(Criteria criteria) {
        try {
            Field[] fields = entityClass.getDeclaredFields();
            ProjectionList projectionList = Projections.projectionList();
            for (int i = 0; i < fields.length; i++) {
                projectionList.add(Projections.property(fields[i].getName()), fields[i].getName());
            }
            criteria.setProjection(projectionList).setResultTransformer(Transformers.aliasToBean(entityClass));
            CriteriaImpl criteria1 = (CriteriaImpl) criteria;
            SessionImpl session1 = (SessionImpl) criteria1.getSession();
            SessionFactoryImplementor factory = session1.getSessionFactory();
            String[] implementors = factory.getImplementors(criteria1.getEntityOrClassName());
            LoadQueryInfluencers loadQueryInfluencers = new LoadQueryInfluencers(factory);
            CriteriaLoader cl = new CriteriaLoader((OuterJoinLoadable) factory.getEntityPersister(implementors[0]),
                    factory,
                    criteria1,
                    implementors[0],
                    loadQueryInfluencers);
            Field f = OuterJoinLoader.class.getDeclaredField("sql");
            f.setAccessible(true);
            String sql = (String) f.get(cl);
            for (int i = 0; i < fields.length; i++) {
                sql = sql.replaceAll("as y" + i + "_", "as " + fields[i].getName());
            }
            return sql;
        } catch (Exception e) {
            throw new WMRuntimeException("Failed to generate query string", e);
        }
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
