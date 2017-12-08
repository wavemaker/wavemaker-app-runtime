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
package com.wavemaker.runtime.soap;

import java.util.Map;

/**
 * This class contains properties used to configure the client binding through request context.
 *
 * @author Frankie Fu
 */
public class SoapServiceSettings {

    private String httpBasicAuthUsername;
    private String httpBasicAuthPassword;

    private String endpointAddress;

    private int connectionTimeout;
    private int requestTimeout;

    private String soapActionURI;
    private String packageName;

    private Map<String, String> httpHeaders;

    /**
     * Returns the target service endpoint address.
     *
     * @return The service endpoint address.
     */
    public String getEndpointAddress() {
        return this.endpointAddress;
    }

    /**
     * Sets the target service endpoint address.
     *
     * @param endpointAddress The service endpoint address.
     */
    public void setEndpointAddress(String endpointAddress) {
        this.endpointAddress = endpointAddress;
    }

    /**
     * Returns the username to be used for HTTP basic authentication.
     *
     * @return The username for authentication.
     */
    public String getHttpBasicAuthUsername() {
        return this.httpBasicAuthUsername;
    }

    /**
     * Sets the username to be used for HTTP basic authentication.
     *
     * @param httpBasicAuthUsername The username for authentication.
     */
    public void setHttpBasicAuthUsername(String httpBasicAuthUsername) {
        this.httpBasicAuthUsername = httpBasicAuthUsername;
    }

    /**
     * Returns the password to be used for HTTP basic authentication.
     *
     * @return The password for authentication.
     */
    public String getHttpBasicAuthPassword() {
        return this.httpBasicAuthPassword;
    }

    /**
     * Sets the password to be used for HTTP basic authentication.
     *
     * @param httpBasicAuthPassword The password for authentication.
     */
    public void setHttpBasicAuthPassword(String httpBasicAuthPassword) {
        this.httpBasicAuthPassword = httpBasicAuthPassword;
    }

    /**
     * Returns the connection timeout value.
     *
     * @return The connection timeout value
     */
    public int getConnectionTimeout() {
        return this.connectionTimeout;
    }

    /**
     * Sets the connection timeout value.
     *
     * @param connectionTimeout The connection timeout value to set.
     */
    public void setConnectionTimeout(int connectionTimeout) {
        this.connectionTimeout = connectionTimeout;
    }

    /**
     * Returns the request timeout value.
     *
     * @return The request timeout value.
     */
    public int getRequestTimeout() {
        return this.requestTimeout;
    }

    /**
     * Sets the request timeout value.
     *
     * @param requestTimeout The request timeout value to set.
     */
    public void setRequestTimeout(int requestTimeout) {
        this.requestTimeout = requestTimeout;
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
     * @return
     */
    public String getPackageName() {
        return packageName;
    }


    /**
     * Sets the service base package name
     * @param packageName
     */
    public void setPackageName(String packageName) {
        this.packageName = packageName;
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
}
