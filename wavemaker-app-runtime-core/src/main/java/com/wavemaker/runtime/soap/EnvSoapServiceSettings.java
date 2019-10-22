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
package com.wavemaker.runtime.soap;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;

/**
 * This class contains properties used to configure the client binding through request context.
 *
 * @author Frankie Fu
 */
public class EnvSoapServiceSettings {

    @Autowired
    private Environment environment;

    private String serviceId;

    private String soapActionURI;
    private String packageName;
    private String wsdlLocation;
    private SoapWsdlSource wsdlSource;
    private String bindingsFile;
    private String wsdlFile;

    private Map<String, String> httpHeaders;
    private Map<String, Object> requestContextProperties;

    /**
     * Returns the serviceId
     *
     * @return String
     */
    public String getServiceId() {
        return serviceId;
    }

    /**
     * Sets serviceId
     *
     * @param serviceId
     */
    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    /**
     * Returns the target service endpoint address.
     *
     * @return The service endpoint address.
     */
    public String getEndpointAddress() {
        return environment.getProperty(serviceId + ".endpoint");
    }

    /**
     * Returns the username to be used for HTTP basic authentication.
     *
     * @return The username for authentication.
     */
    public String getHttpBasicAuthUsername() {
        return environment.getProperty(serviceId + ".username");
    }

    /**
     * Returns the password to be used for HTTP basic authentication.
     *
     * @return The password for authentication.
     */
    public String getHttpBasicAuthPassword() {
        return environment.getProperty(serviceId + ".password");
    }

    /**
     * Returns the connection timeout value.
     *
     * @return The connection timeout value
     */
    public int getConnectionTimeout() {
        return environment.getProperty(serviceId + ".connectionTimeout", Integer.class);
    }

    /**
     * Returns the request timeout value.
     *
     * @return The request timeout value.
     */
    public int getRequestTimeout() {
        return environment.getProperty(serviceId + ".requestTimeout", Integer.class);
    }


    /**
     * Returns the SOAPAction URI.
     *
     * @return The SOAPAction URI.
     */
    public String getSoapActionURI() {
        return this.soapActionURI;
    }

    /**
     * Sets the SOAPAction URI.
     *
     * @param soapActionURI The SOAPAction URI.
     */
    public void setSoapActionURI(String soapActionURI) {
        this.soapActionURI = soapActionURI;
    }


    /**
     * Returns the service base package name
     *
     * @return
     */
    public String getPackageName() {
        return packageName;
    }


    /**
     * Sets the service base package name
     *
     * @param packageName
     */
    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }


    /**
     * Gets the location (URL) of wsdl
     *
     * @return
     */
    public String getWsdlLocation() {
        return wsdlLocation;
    }

    /**
     * Sets the location (URL) of wsdl
     *
     * @param wsdlLocation
     */
    public void setWsdlLocation(String wsdlLocation) {
        this.wsdlLocation = wsdlLocation;
    }


    public SoapWsdlSource getWsdlSource() {
        return wsdlSource;
    }

    public void setWsdlSource(SoapWsdlSource wsdlSource) {
        this.wsdlSource = wsdlSource;
    }

    /**
     * Returns additional HTTP headers.
     *
     * @return The additional HTTP headers.
     */
    public Map<String, String> getHttpHeaders() {
        return this.httpHeaders;
    }

    /**
     * Sets additional HTTP headers.
     *
     * @param httpHeaders Additional HTTP headers.
     */
    public void setHttpHeaders(Map<String, String> httpHeaders) {
        this.httpHeaders = httpHeaders;
    }


    public String getBindingsFile() {
        return bindingsFile;
    }

    public void setBindingsFile(String bindingsFile) {
        this.bindingsFile = bindingsFile;
    }

    public String getWsdlFile() {
        return wsdlFile;
    }

    public void setWsdlFile(String wsdlFile) {
        this.wsdlFile = wsdlFile;
    }

    public Map<String, Object> getRequestContextProperties() {
        return requestContextProperties;
    }

    public void setRequestContextProperties(Map<String, Object> requestContextProperties) {
        this.requestContextProperties = requestContextProperties;
    }

    public SoapServiceSettings getSettings() {
        SoapServiceSettings soapServiceSettings = new SoapServiceSettings();
        soapServiceSettings.setBindingsFile(getBindingsFile());
        soapServiceSettings.setConnectionTimeout(getConnectionTimeout());
        soapServiceSettings.setEndpointAddress(getEndpointAddress());
        soapServiceSettings.setHttpBasicAuthPassword(getHttpBasicAuthPassword());
        soapServiceSettings.setHttpBasicAuthUsername(getHttpBasicAuthUsername());
        soapServiceSettings.setHttpHeaders(getHttpHeaders());
        soapServiceSettings.setPackageName(getPackageName());
        soapServiceSettings.setRequestContextProperties(getRequestContextProperties());
        soapServiceSettings.setRequestTimeout(getRequestTimeout());
        soapServiceSettings.setSoapActionURI(getSoapActionURI());
        soapServiceSettings.setWsdlFile(getWsdlFile());
        soapServiceSettings.setWsdlLocation(getWsdlLocation());
        soapServiceSettings.setWsdlSource(getWsdlSource());
        return soapServiceSettings;
    }
}
