package com.wavemaker.runtime.rest.service;

import java.net.URI;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.conn.ssl.AllowAllHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.X509HostnameVerifier;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.protocol.HttpContext;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.ResponseErrorHandler;

import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.studio.common.util.SSLUtils;
import com.wavemaker.studio.common.util.WMUtils;

/**
 * @author Uday Shankar
 */

public class RestConnector {

    private final X509HostnameVerifier hostnameVerifier = new AllowAllHostnameVerifier();

    public RestResponse invokeRestCall(RestRequestInfo restRequestInfo) {
        final HttpClientContext httpClientContext = HttpClientContext.create();

        ResponseEntity<String> responseEntity = getResponseEntity(restRequestInfo,
                httpClientContext, String.class);

        RestResponse restResponse = new RestResponse();
        restResponse.setResponseBody(responseEntity.getBody());
        restResponse.setStatusCode(responseEntity.getStatusCode().value());
        restResponse.setCookieStore(httpClientContext.getCookieStore());
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
        if (httpMethod == null) {
            throw new IllegalArgumentException("Invalid method value [" + restRequestInfo.getMethod() + "]");
        }

        // Creating HttpClientBuilder and setting Request Config.
        HttpClientBuilder httpClientBuilder = HttpClients.custom();
        httpClientBuilder.setDefaultRequestConfig(requestConfig);

        String endpointAddress = URLDecoder.decode(restRequestInfo.getEndpointAddress());
        if (endpointAddress.startsWith("https")) {
            httpClientBuilder.setSSLSocketFactory(
                    new SSLConnectionSocketFactory(SSLUtils.getAllTrustedCertificateSSLContext(), hostnameVerifier));
        }

        CloseableHttpClient httpClient = httpClientBuilder.build();
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(
                httpClient) {
            @Override
            protected HttpContext createHttpContext(final HttpMethod httpMethod, final URI uri) {
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
        if (HttpMethod.GET != httpMethod) {
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