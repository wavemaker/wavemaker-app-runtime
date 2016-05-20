package com.wavemaker.runtime.report.service;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;
import java.util.Properties;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.internal.SessionImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.report.model.ReportContext;
import net.sf.jasperreports.engine.query.JRHibernateQueryExecuterFactory;

/**
 * Created by kishorer on 23/5/16.
 */
@Component("dbReport")
public class DBJasperReportGenerator extends AbstractJasperReportGenerator {

    private static final Logger LOGGER = LoggerFactory.getLogger(DBJasperReportGenerator.class);

    public static final String SESSION_FACTORY_REF = "sessionFactoryRef";
    public static final String QUERY_TYPE = "queryType";

    private enum QueryType {
        HQL("hql"),
        SQL("sql");

        private String value;

        QueryType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static QueryType getQueryType(String type) {
            for (QueryType queryType : QueryType.values()) {
                if (queryType.getValue().equals(type)) {
                    return queryType;
                }
            }
            throw new IllegalArgumentException("No db type found for " + type);
        }

    }

    @Override
    public DownloadResponse generateReport(ReportContext reportContext) {
        Properties properties = reportContext.getProperties();
        String queryType = String.valueOf(properties.get(QUERY_TYPE));
        if (QueryType.getQueryType(queryType) == QueryType.HQL) {
            return generateReportByHibernateSession(reportContext);
        } else {
            return generateReportByJDBCConnection(reportContext);
        }
    }

    private DownloadResponse generateReportByHibernateSession(ReportContext reportContext) {
        String sessionFactoryRef = String.valueOf(reportContext.getProperties().get(SESSION_FACTORY_REF));
        Session session = getNewSessionByDataService(sessionFactoryRef);
        try {
            Map<String, Object> parameters = reportContext.getParameters();
            parameters.put(JRHibernateQueryExecuterFactory.PARAMETER_HIBERNATE_SESSION, session);
            return buildReport(reportContext);
        } finally {
            if (session != null && !((SessionImpl) session).isClosed()) {
                session.close();
            }
        }
    }

    private DownloadResponse generateReportByJDBCConnection(ReportContext reportContext) {
        String sessionFactoryRef = String.valueOf(reportContext.getProperties().get(SESSION_FACTORY_REF));
        Session session = getNewSessionByDataService(sessionFactoryRef);
        Connection connection = null;
        try {
            SessionImpl sessionImpl = (SessionImpl) session;
            connection = sessionImpl.connection();
            Map<String, Object> parameters = reportContext.getParameters();
            parameters.put("REPORT_CONNECTION", connection);
            return buildReport(reportContext);
        } finally {
            try {
                if (connection != null && !connection.isClosed()) {
                    connection.close();
                }
            } catch (SQLException e) {
                LOGGER.error("Failed to close db the connection for {} ", reportContext.getReportName(), e);
            }
            if (session != null && !((SessionImpl) session).isClosed()) {
                session.close();
            }
        }
    }

    private Session getNewSessionByDataService(String sessionFactoryRef){
        WMAppContext wmAppContext = WMAppContext.getInstance();
        SessionFactory sessionFactory = wmAppContext.getSpringBean(sessionFactoryRef);
        return sessionFactory.openSession();
    }

}
