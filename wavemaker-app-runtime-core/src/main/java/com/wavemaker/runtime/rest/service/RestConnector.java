/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.rest.service;

import java.net.URI;
import java.util.concurrent.TimeUnit;

import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.config.CookieSpecs;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.protocol.HttpContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.ResponseErrorHandler;

import com.wavemaker.commons.proxy.AppProxyConstants;
import com.wavemaker.commons.util.SSLUtils;
import com.wavemaker.runtime.AppRuntimeProperties;
import com.wavemaker.runtime.rest.model.HttpRequestDetails;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;

/**
 * @author Uday Shankar
 */

public class RestConnector {


    private static final Logger logger = LoggerFactory.getLogger(RestConnector.class);

    private static CloseableHttpClient defaultHttpClient;
    private static final int MAX_TOTAL = 500;
    private static final int DEFAULT_MAX_PER_ROUTE = 50;

    public HttpResponseDetails invokeRestCall(HttpRequestDetails httpRequestDetails) {
        final HttpClientContext httpClientContext = HttpClientContext.create();

        logger.debug("Sending {} request to URL {}", httpRequestDetails.getMethod(), httpRequestDetails.getEndpointAddress());
        ResponseEntity<byte[]> responseEntity = getResponseEntity(httpRequestDetails,
                httpClientContext, byte[].class);

        HttpResponseDetails httpResponseDetails = new HttpResponseDetails();
        httpResponseDetails.setResponseBody(responseEntity.getBody());
        httpResponseDetails.setStatusCode(responseEntity.getStatusCode().value());
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.putAll(responseEntity.getHeaders());
        httpResponseDetails.setHeaders(httpHeaders);
        return httpResponseDetails;
    }

    public <T> ResponseEntity<T> invokeRestCall(HttpRequestDetails httpRequestDetails, Class<T> t) {

        logger.debug("Sending {} request to URL {}", httpRequestDetails.getMethod(), httpRequestDetails.getEndpointAddress());
        final HttpClientContext httpClientContext = HttpClientContext.create();
        return getResponseEntity(httpRequestDetails, httpClientContext, t);
    }

    private <T> ResponseEntity<T> getResponseEntity(
            final HttpRequestDetails httpRequestDetails, final HttpClientContext
            httpClientContext, Class<T> t) {

        // equivalent to "http.protocol.handle-redirects", false

        HttpMethod httpMethod = HttpMethod.valueOf(httpRequestDetails.getMethod());

        // Creating HttpClientBuilder and setting Request Config.


        CloseableHttpClient httpClient = null;
        String endpointAddress = null;
        endpointAddress = httpRequestDetails.getEndpointAddress();

        httpClient = getHttpClient();

        final RequestConfig requestConfig = RequestConfig.custom()
                .setRedirectsEnabled(httpRequestDetails.isRedirectEnabled())
                .setCookieSpec(CookieSpecs.IGNORE_COOKIES)
                .build();

        HttpComponentsClientHttpRequestFactory clientHttpRequestFactory = new HttpComponentsClientHttpRequestFactory(httpClient) {
            @Override
            protected HttpContext createHttpContext(HttpMethod httpMethod, URI uri) {
                return httpClientContext;
            }

            @Override
            protected RequestConfig createRequestConfig(Object client) {
                return requestConfig;
            }
        };
        clientHttpRequestFactory.setReadTimeout((int) TimeUnit.MINUTES.toMillis(6));// 6 mins, something more than lb time out  
        clientHttpRequestFactory.setConnectTimeout((int) TimeUnit.SECONDS.toMillis(30));
        clientHttpRequestFactory.setConnectionRequestTimeout((int) TimeUnit.SECONDS.toMillis(30));

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.putAll(httpRequestDetails.getHeaders());

        WMRestTemplate wmRestTemplate = new WMRestTemplate();
        wmRestTemplate.setRequestFactory(clientHttpRequestFactory);
        wmRestTemplate.setErrorHandler(getExceptionHandler());
        HttpEntity requestEntity;
        com.wavemaker.commons.web.http.HttpMethod wmHttpMethod = com.wavemaker.commons.web.http.HttpMethod.valueOf(httpRequestDetails.getMethod());
        if (wmHttpMethod.isRequestBodySupported()) {
            requestEntity = new HttpEntity(httpRequestDetails.getRequestBody(), httpHeaders);
        } else {
            requestEntity = new HttpEntity(httpHeaders);
        }
        return wmRestTemplate
                .exchange(endpointAddress, httpMethod, requestEntity, t);
    }


    class WMRestServicesErrorHandler extends DefaultResponseErrorHandler {

        @Override
        protected boolean hasError(HttpStatus statusCode) {
            return false;
        }
    }

    public ResponseErrorHandler getExceptionHandler() {
        return new WMRestServicesErrorHandler();
    }


    private CloseableHttpClient getHttpClient() {
        if (defaultHttpClient == null) {
            synchronized (RestConnector.class) {
                if (defaultHttpClient == null) {
                    defaultHttpClient = HttpClients.custom()
                            .setDefaultCredentialsProvider(getCredentialProvider())
                            .setConnectionManager(getConnectionManager())
                            .build();
                }
            }
        }
        return defaultHttpClient;
    }

    private CredentialsProvider getCredentialProvider() {

        boolean isEnabled = Boolean.valueOf(AppRuntimeProperties.getProperty(AppProxyConstants.APP_PROXY_ENABLED));
        CredentialsProvider credentialsProvider = null;
        if (isEnabled) {
            credentialsProvider = new BasicCredentialsProvider();
            String hostName = AppRuntimeProperties.getProperty(AppProxyConstants.APP_PROXY_HOST);
            String port = AppRuntimeProperties.getProperty(AppProxyConstants.APP_PROXY_PORT);
            String userName = AppRuntimeProperties.getProperty(AppProxyConstants.APP_PROXY_USERNAME);
            if (userName == null) {
                userName = "";
            }
            String passWord = AppRuntimeProperties.getProperty(AppProxyConstants.APP_PROXY_PASSWORD);
            int proxyPort = 0;
            if (port != null && !("".equals(port))) {
                proxyPort = Integer.valueOf(port);
            }
            credentialsProvider.setCredentials(new AuthScope(hostName, proxyPort), new UsernamePasswordCredentials(userName, passWord));
        }
        return credentialsProvider;
    }

    private PoolingHttpClientConnectionManager getConnectionManager() {
        Registry<ConnectionSocketFactory> registry = RegistryBuilder.<ConnectionSocketFactory>create()
                .register("http", PlainConnectionSocketFactory.getSocketFactory())
                .register("https", new SSLConnectionSocketFactory(SSLUtils.getAllTrustedCertificateSSLContext(), new String[]{"TLSv1.2", "TLSv1.1", "TLSv1"}, null, NoopHostnameVerifier.INSTANCE))
                .build();

        PoolingHttpClientConnectionManager poolingHttpClientConnectionManager = new PoolingHttpClientConnectionManager(registry);
        poolingHttpClientConnectionManager.setMaxTotal(MAX_TOTAL);
        poolingHttpClientConnectionManager.setDefaultMaxPerRoute(DEFAULT_MAX_PER_ROUTE);
        return poolingHttpClientConnectionManager;
    }


}