package com.wavemaker.runtime.data.datasource;

import com.wavemaker.studio.common.WMRuntimeException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.datasource.DelegatingDataSource;
import org.springframework.jndi.JndiTemplate;

import javax.naming.NamingException;
import javax.sql.DataSource;

/**
 * Created by kishorer on 11/12/15.
 */
public class WMDataSource extends DelegatingDataSource {

    private DataSourceType dataSourceType;
    private String serviceId;

    private String jndiName;

    @Autowired
    private ApplicationContext context;

    public WMDataSource() {
    }

    public DataSourceType getDataSourceType() {
        return dataSourceType;
    }

    public void setDataSourceType(DataSourceType dataSourceType) {
        this.dataSourceType = dataSourceType;
    }

    public String getJndiName() {
        return jndiName;
    }

    public void setJndiName(String jndiName) {
        this.jndiName = jndiName;
    }

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    @Override
    public void afterPropertiesSet() {
        super.setTargetDataSource(getRequiredDatasource());
        super.afterPropertiesSet();
    }

    private DataSource getRequiredDatasource() {
        DataSource dataSource;
        try {
            if (getDataSourceType() == DataSourceType.JNDI_DATASOURCE) {
                JndiTemplate jndiTemplate = new JndiTemplate();
                dataSource = jndiTemplate.lookup(getJndiName(), DataSource.class);
            } else {
                dataSource = context.getBean(serviceId + "WMManagedDataSource", DataSource.class);
            }
        } catch (NamingException e) {
            throw new WMRuntimeException(e.getMessage(), e);
        }
        return dataSource;
    }
}
