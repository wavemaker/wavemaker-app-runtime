/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URLDecoder;

import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.protocol.HttpContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.ResponseErrorHandler;

import com.wavemaker.runtime.rest.model.HttpRequestDetails;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;
import com.wavemaker.commons.CommonConstants;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.SSLUtils;

/**
 * @author Uday Shankar
 */

public class RestConnector {

    private static final Logger logger = LoggerFactory.getLogger(RestConnector.class);

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
        RequestConfig requestConfig = RequestConfig.custom().setRedirectsEnabled(httpRequestDetails.isRedirectEnabled())
                .build();

        HttpMethod httpMethod = HttpMethod.valueOf(httpRequestDetails.getMethod());

        // Creating HttpClientBuilder and setting Request Config.
        HttpClientBuilder httpClientBuilder = HttpClients.custom();
        httpClientBuilder.setDefaultRequestConfig(requestConfig);

        String endpointAddress = null;
        try {
            endpointAddress = URLDecoder.decode(httpRequestDetails.getEndpointAddress(), CommonConstants.UTF8);
        } catch (UnsupportedEncodingException e) {
            throw new WMRuntimeException("Failed to decode url " + httpRequestDetails.getEndpointAddress(), e);
        }
        if (endpointAddress.startsWith("https")) {
            httpClientBuilder.setSSLSocketFactory(
                    new SSLConnectionSocketFactory(SSLUtils.getAllTrustedCertificateSSLContext(), new String[]{"TLSv1.2","TLSv1.1","TLSv1"}, null, NoopHostnameVerifier.INSTANCE));
        }

        if (httpRequestDetails.getProxy() != null) {
            logger.debug("setting proxyProperties for request URL {}", httpRequestDetails.getEndpointAddress());
            com.wavemaker.runtime.commons.model.Proxy proxy = httpRequestDetails.getProxy();
            CredentialsProvider credentialsProvider = new BasicCredentialsProvider();
            credentialsProvider.setCredentials(new AuthScope(proxy.getHostname(), proxy.getPort()), new UsernamePasswordCredentials(proxy.getUsername(), proxy.getPassword()));
            httpClientBuilder.useSystemProperties();
            httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider);
            httpClientBuilder.setProxy(new HttpHost(proxy.getHostname(), proxy.getPort()));
        }
        CloseableHttpClient httpClient = httpClientBuilder.build();
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient) {
            @Override
            protected HttpContext createHttpContext(HttpMethod httpMethod, URI uri) {
                return httpClientContext;
            }
        };
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.putAll(httpRequestDetails.getHeaders());

        WMRestTemplate wmRestTemplate = new WMRestTemplate();
        wmRestTemplate.setRequestFactory(factory);
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
}