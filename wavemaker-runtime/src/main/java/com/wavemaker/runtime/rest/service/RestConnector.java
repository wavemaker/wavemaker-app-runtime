package com.wavemaker.runtime.rest.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.httpclient.Credentials;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.UsernamePasswordCredentials;
import org.apache.commons.httpclient.auth.AuthScope;
import org.apache.commons.lang.StringUtils;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.CommonsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.RestTemplate;

import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;

/**
 * @author Uday Shankar
 */
@Component
public class RestConnector {

    public RestResponse invokeRestCall(RestRequestInfo restRequestInfo) {
        HttpMethod httpMethod = HttpMethod.valueOf(restRequestInfo.getMethod());
        if(httpMethod == null) {
            throw new IllegalArgumentException("Invalid method value [" + restRequestInfo.getMethod() + "]");
        }
        RestTemplate restTemplate = new RestTemplate();
        HttpClient httpClient = new HttpClient();
        CommonsClientHttpRequestFactory commonsClientHttpRequestFactory = new CommonsClientHttpRequestFactory(httpClient);
        MultiValueMap headersMap = new LinkedMultiValueMap();


        //set basic authorization
        if(restRequestInfo.getBasicAuth()) {
            httpClient.getParams().setAuthenticationPreemptive(true);
            Credentials credentials = new UsernamePasswordCredentials(restRequestInfo.getUserName(), restRequestInfo.getPassword());
            httpClient.getState().setCredentials(AuthScope.ANY, credentials);
        }

        //set headers
        Map<String, String> headers = restRequestInfo.getHeaders();
        if (headers != null && !headers.isEmpty()) {
            for (Map.Entry<String, String> entry : headers.entrySet()) {
                headersMap.add(entry.getKey(), entry.getValue());
            }
        }

        String contentType = restRequestInfo.getContentType();
        if(!StringUtils.isBlank(contentType)) {
            headersMap.add("Content-Type", contentType);
        }

        restTemplate.setRequestFactory(commonsClientHttpRequestFactory);
        restTemplate.setErrorHandler(new WMRestServicesErrorHandler());

        HttpEntity requestEntity;

        if(HttpMethod.GET != httpMethod) {
            String requestBody = (restRequestInfo.getRequestBody() == null)?"":restRequestInfo.getRequestBody();
            requestEntity = new HttpEntity(requestBody, headersMap);
        } else {
            requestEntity = new HttpEntity(headersMap);
        }
        ResponseEntity<String> responseEntity = restTemplate.exchange(restRequestInfo.getEndpointAddress(), httpMethod, requestEntity, String.class);

        RestResponse restResponse = new RestResponse();
        restResponse.setResponseBody(responseEntity.getBody());
        restResponse.setStatusCode(responseEntity.getStatusCode().value());
        Map<String, List<String>> responseHeaders = new HashMap<String, List<String>>();
        HttpHeaders httpHeaders = responseEntity.getHeaders();
        for(String responseHeaderKey : httpHeaders.keySet()) {
            responseHeaders.put(responseHeaderKey, httpHeaders.get(responseHeaderKey));
        }
        MediaType mediaType = responseEntity.getHeaders().getContentType();
        if(mediaType != null) {
            String outputContentType = mediaType.toString();
            if(outputContentType.contains(";")) {
                outputContentType = outputContentType.substring(0, outputContentType.indexOf(";"));
            }
            restResponse.setContentType(outputContentType);
        }
        restResponse.setResponseHeaders(responseHeaders);
        restResponse.setResponseBody(restResponse.getResponseBody());
        return restResponse;
    }

    class WMRestServicesErrorHandler extends DefaultResponseErrorHandler {

        @Override
        protected boolean hasError(HttpStatus statusCode) {
            return false;
        }
    }
}