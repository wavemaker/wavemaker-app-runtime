package com.wavemaker.runtime.rest.service;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.conn.ssl.AllowAllHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.X509HostnameVerifier;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.DefaultResponseErrorHandler;

import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.studio.common.util.SSLUtils;
import com.wavemaker.studio.common.util.WMUtils;

/**
 * @author Uday Shankar
 */
@Component
public class RestConnector {

    private final X509HostnameVerifier hostnameVerifier = new AllowAllHostnameVerifier();

    public RestResponse invokeRestCall(RestRequestInfo restRequestInfo) {
        HttpMethod httpMethod = HttpMethod.valueOf(restRequestInfo.getMethod());
        if (httpMethod == null) {
            throw new IllegalArgumentException("Invalid method value [" + restRequestInfo.getMethod() + "]");
        }
        WMRestTemplate wmRestTemplate = new WMRestTemplate();


        HttpClientBuilder httpClientBuilder = HttpClients.custom();

        String endpointAddress = URLDecoder.decode(restRequestInfo.getEndpointAddress());
        if (endpointAddress.startsWith("https")) {
            httpClientBuilder.setSSLSocketFactory(new SSLConnectionSocketFactory(SSLUtils.getAllTrustedCertificateSSLContext(), hostnameVerifier));
        }

        CloseableHttpClient httpClient = httpClientBuilder.build();
        HttpComponentsClientHttpRequestFactory commonsClientHttpRequestFactory = new HttpComponentsClientHttpRequestFactory(httpClient);
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
            headersMap.add("Content-Type", contentType);
        }

        if (restRequestInfo.doesHaveAuthorization()) {
            headersMap.add("Authorization", restRequestInfo.getAuthorization());
        }

        wmRestTemplate.setRequestFactory(commonsClientHttpRequestFactory);
        wmRestTemplate.setErrorHandler(new WMRestServicesErrorHandler());

        HttpEntity requestEntity;

        if (HttpMethod.GET != httpMethod) {
            String requestBody = (restRequestInfo.getRequestBody() == null) ? "" : restRequestInfo.getRequestBody();
            requestEntity = new HttpEntity(requestBody, headersMap);
        } else {
            requestEntity = new HttpEntity(headersMap);
        }
        ResponseEntity<String> responseEntity = wmRestTemplate.exchange(endpointAddress, httpMethod, requestEntity, String.class);

        RestResponse restResponse = new RestResponse();
        restResponse.setResponseBody(responseEntity.getBody());
        restResponse.setStatusCode(responseEntity.getStatusCode().value());
        Map<String, List<String>> responseHeaders = new HashMap<String, List<String>>();
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

    class WMRestServicesErrorHandler extends DefaultResponseErrorHandler {

        @Override
        protected boolean hasError(HttpStatus statusCode) {
            return false;
        }
    }
}