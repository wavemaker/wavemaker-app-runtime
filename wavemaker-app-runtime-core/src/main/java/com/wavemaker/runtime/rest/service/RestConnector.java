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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.conn.ssl.AllowAllHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.X509HostnameVerifier;
import org.apache.http.cookie.Cookie;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.cookie.BasicClientCookie;
import org.apache.http.protocol.HttpContext;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.ResponseErrorHandler;

import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.studio.common.CommonConstants;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.SSLUtils;
import com.wavemaker.studio.common.util.WMUtils;

/**
 * @author Uday Shankar
 */

public class RestConnector {

    private final X509HostnameVerifier hostnameVerifier = new AllowAllHostnameVerifier();

    public RestResponse invokeRestCall(RestRequestInfo restRequestInfo) {
        final HttpClientContext httpClientContext = HttpClientContext.create();

        ResponseEntity<byte[]> responseEntity = getResponseEntity(restRequestInfo,
                httpClientContext, byte[].class);

        RestResponse restResponse = new RestResponse();
        restResponse.setResponseBody(responseEntity.getBody());
        restResponse.setStatusCode(responseEntity.getStatusCode().value());
        // Converting form Cookie to BasicClientCookie.
        final List<Cookie> cookies = httpClientContext.getCookieStore().getCookies();
        List<BasicClientCookie> clientCookies = new ArrayList<>();
        for (Cookie cookie : cookies) {
            clientCookies.add((BasicClientCookie) cookie);
        }
        restResponse.setCookies(clientCookies);
        Map<String, List<String>> responseHeaders = new HashMap<>();
        HttpHeaders httpHeaders = responseEntity.getHeaders();
        for (String responseHeaderKey : httpHeaders.keySet()) {
            responseHeaders.put(responseHeaderKey, httpHeaders.get(responseHeaderKey));
        }
        MediaType mediaType = responseEntity.getHeaders().getContentType();
        if (mediaType != null) {
            String outputContentType = mediaType.toString();
            if (outputContentType.contains(";")) {
                outputContentType = outputContentType.substring(0, outputContentType.indexOf(";"));
            }
            restResponse.setContentType(outputContentType);
        }
        restResponse.setResponseHeaders(responseHeaders);
        return restResponse;
    }

    public <T> ResponseEntity<T> invokeRestCall(RestRequestInfo restRequestInfo, Class<T> t) {

        final HttpClientContext httpClientContext = HttpClientContext.create();
        return getResponseEntity(restRequestInfo, httpClientContext, t);
    }

    private <T> ResponseEntity<T> getResponseEntity(
            final RestRequestInfo restRequestInfo, final HttpClientContext
            httpClientContext, Class<T> t) {

        // equivalent to "http.protocol.handle-redirects", false
        RequestConfig requestConfig = RequestConfig.custom().setRedirectsEnabled(restRequestInfo.isRedirectEnabled())
                .build();

        HttpMethod httpMethod = HttpMethod.valueOf(restRequestInfo.getMethod());

        // Creating HttpClientBuilder and setting Request Config.
        HttpClientBuilder httpClientBuilder = HttpClients.custom();
        httpClientBuilder.setDefaultRequestConfig(requestConfig);

        String endpointAddress = null;
        try {
            endpointAddress = URLDecoder.decode(restRequestInfo.getEndpointAddress(), CommonConstants.UTF8);
        } catch (UnsupportedEncodingException e) {
            throw new WMRuntimeException("Failed to decode url " + restRequestInfo.getEndpointAddress(), e);
        }
        if (endpointAddress.startsWith("https")) {
            httpClientBuilder.setSSLSocketFactory(
                    new SSLConnectionSocketFactory(SSLUtils.getAllTrustedCertificateSSLContext(), hostnameVerifier));
        }

        if (restRequestInfo.getProxy() != null) {
            com.wavemaker.runtime.commons.model.Proxy proxy = restRequestInfo.getProxy();
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
        MultiValueMap headersMap = new LinkedMultiValueMap();

        //set headers
        Map<String, Object> headers = restRequestInfo.getHeaders();
        if (headers != null && !headers.isEmpty()) {
            for (Map.Entry<String, Object> entry : headers.entrySet()) {
                String[] stringList = WMUtils.getStringList(entry.getValue());
                for (String str : stringList) {
                    headersMap.add(entry.getKey(), str);
                }
            }
        }

        String contentType = restRequestInfo.getContentType();
        if (!StringUtils.isBlank(contentType)) {
            headersMap.add(RestConstants.CONTENT_TYPE, contentType);
        }
        WMRestTemplate wmRestTemplate = new WMRestTemplate();
        wmRestTemplate.setRequestFactory(factory);
        wmRestTemplate.setErrorHandler(getExceptionHandler());
        HttpEntity requestEntity;
        com.wavemaker.studio.common.web.http.HttpMethod wmHttpMethod = com.wavemaker.studio.common.web.http.HttpMethod.valueOf(restRequestInfo.getMethod());
        if (wmHttpMethod.isRequestBodySupported()) {
            requestEntity = new HttpEntity(restRequestInfo.getRequestBody(), headersMap);
        } else {
            requestEntity = new HttpEntity(headersMap);
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