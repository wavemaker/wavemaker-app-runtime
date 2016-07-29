package com.wavemaker.runtime.servicedef.model;

import java.util.HashMap;
import java.util.Map;

import javax.validation.constraints.NotNull;

import com.wavemaker.studio.common.servicedef.model.ServiceDefinition;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 28/7/16
 */
public class ServiceDefinitionWrapper {

    @NotNull
    private String name;

    private Map<String, ServiceDefinition> serviceDefinitions;

    public ServiceDefinitionWrapper(final String name) {
        this(name, new HashMap<String, ServiceDefinition>());
    }

    public ServiceDefinitionWrapper(final String name, final Map<String, ServiceDefinition> serviceDefinitions) {
        this.name = name;
        this.serviceDefinitions = serviceDefinitions;
    }

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public Map<String, ServiceDefinition> getServiceDefinitions() {
        return serviceDefinitions;
    }

    public void setServiceDefinitions(final Map<String, ServiceDefinition> serviceDefinitions) {
        this.serviceDefinitions = serviceDefinitions;
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (!(o instanceof ServiceDefinitionWrapper)) return false;

        final ServiceDefinitionWrapper that = (ServiceDefinitionWrapper) o;

        if (!name.equals(that.name)) return false;

        return true;
    }

    @Override
    public int hashCode() {
        return name.hashCode();
    }
}
