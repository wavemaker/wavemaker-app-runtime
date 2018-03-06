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
package com.wavemaker.runtime.data.datasource;

import javax.naming.NamingException;
import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.datasource.DelegatingDataSource;
import org.springframework.jndi.JndiTemplate;

import com.wavemaker.commons.WMRuntimeException;

/**
 * Created by kishorer on 11/12/15.
 */
public class WMDataSource extends DelegatingDataSource {

    private DataSourceType dataSourceType;
    private String serviceId;

    private String jndiName;

    @Autowired
    private ApplicationContext context;

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
