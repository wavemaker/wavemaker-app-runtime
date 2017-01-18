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

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.text.StrSubstitutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;

import com.wavemaker.runtime.AppRuntimeProperties;
import com.wavemaker.runtime.commons.model.Proxy;
import com.wavemaker.runtime.rest.RequestDataBuilder;
import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.HttpRequestDetails;
import com.wavemaker.runtime.rest.model.HttpRequestData;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;
import com.wavemaker.runtime.rest.processor.data.HttpRequestDataProcessor;
import com.wavemaker.runtime.rest.processor.data.HttpRequestDataProcessorContext;
import com.wavemaker.runtime.rest.processor.request.HttpRequestProcessor;
import com.wavemaker.runtime.rest.processor.request.HttpRequestProcessorContext;
import com.wavemaker.runtime.rest.processor.response.HttpResponseProcessor;
import com.wavemaker.runtime.rest.processor.response.HttpResponseProcessorContext;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.proxy.AppProxyConstants;
import com.wavemaker.studio.common.swaggerdoc.util.SwaggerDocUtil;
import com.wavemaker.studio.common.util.WMUtils;
import com.wavemaker.tools.apidocs.tools.core.model.Operation;
import com.wavemaker.tools.apidocs.tools.core.model.ParameterType;
import com.wavemaker.tools.apidocs.tools.core.model.Path;
import com.wavemaker.tools.apidocs.tools.core.model.Swagger;
import com.wavemaker.tools.apidocs.tools.core.model.parameters.Parameter;

/**
 * @author Uday Shankar
 */
public class RestRuntimeService {

    private RestRuntimeServiceCacheHelper restRuntimeServiceCacheHelper = new RestRuntimeServiceCacheHelper();

    private static final String AUTHORIZATION = "authorization";

    private static final Logger logger = LoggerFactory.getLogger(RestRuntimeService.class);


    public HttpResponseDetails executeRestCall(String serviceId, String operationId, HttpServletRequest httpServletRequest) throws IOException {
        HttpRequestData httpRequestData = constructRequestData(httpServletRequest);
        HttpRequestDataProcessorContext httpRequestDataProcessorContext = new HttpRequestDataProcessorContext(httpServletRequest, httpRequestData);
        List<HttpRequestDataProcessor> httpRequestDataProcessors = restRuntimeServiceCacheHelper.getHttpRequestDataProcessors(serviceId);
        for (HttpRequestDataProcessor httpRequestDataProcessor : httpRequestDataProcessors) {
            httpRequestDataProcessor.process(httpRequestDataProcessorContext);
        }


        HttpRequestDetails httpRequestDetails = constructHttpRequest(serviceId, operationId, httpRequestData);
        HttpRequestProcessorContext httpRequestProcessorContext = new HttpRequestProcessorContext(httpServletRequest, httpRequestDetails, httpRequestData);
        List<HttpRequestProcessor> httpRequestProcessors = restRuntimeServiceCacheHelper.getHttpRequestProcessors(serviceId);
        for (HttpRequestProcessor httpRequestProcessor : httpRequestProcessors) {
            httpRequestProcessor.process(httpRequestProcessorContext);
        }

        if (logger.isDebugEnabled()) {
            logger.debug("Rest service request details {}", httpRequestDetails.toString());
        }

        HttpResponseDetails httpResponseDetails = invokeRestCall(httpRequestDetails);

        HttpResponseProcessorContext httpResponseProcessorContext = new HttpResponseProcessorContext(httpServletRequest, httpResponseDetails, httpRequestDetails, httpRequestData);
        List<HttpResponseProcessor> httpResponseProcessors = restRuntimeServiceCacheHelper.getHttpResponseProcessors(serviceId);
        for (HttpResponseProcessor httpResponseProcessor : httpResponseProcessors) {
            httpResponseProcessor.process(httpResponseProcessorContext);
        }

        if (logger.isDebugEnabled()) {
            logger.debug("Rest service response details for the endpoint {} is {}", httpRequestDetails.getEndpointAddress(), httpResponseDetails.toString());
        }
        return httpResponseDetails;
    }

    private HttpRequestData constructRequestData(HttpServletRequest httpServletRequest) {
        HttpRequestData httpRequestData = null;
        try {
            httpRequestData = new RequestDataBuilder().getRequestData(httpServletRequest);
        } catch (Exception e) {
            throw new WMRuntimeException("Failed to construct HttpRequestData for the request", e);
        }
        return httpRequestData;
    }

    private HttpRequestDetails constructHttpRequest(String serviceId, String operationId, HttpRequestData httpRequestData) throws IOException {
        Swagger swagger = restRuntimeServiceCacheHelper.getSwaggerDoc(serviceId);
        Map.Entry<String, Path> pathEntry = swagger.getPaths().entrySet().iterator().next();
        String pathValue = pathEntry.getKey();
        Path path = pathEntry.getValue();
        Operation operation = getOperation(path, operationId);

        HttpHeaders httpHeaders = new HttpHeaders();
        Map<String, Object> queryParameters = new HashMap();
        Map<String, String> pathParameters = new HashMap();
        byte[] requestBody = null;
        requestBody = filterRequestData(httpRequestData, operation, httpHeaders, queryParameters, pathParameters, requestBody);

        HttpRequestDetails httpRequestDetails = new HttpRequestDetails();
        httpRequestDetails.setEndpointAddress(getEndPointAddress(swagger, pathValue, queryParameters, pathParameters));
        httpRequestDetails.setMethod(SwaggerDocUtil.getOperationType(path, operation.getOperationId()).toUpperCase());

        httpRequestDetails.setHeaders(httpHeaders);
        httpRequestDetails.setRequestBody(requestBody);

        updateProxyDetails(httpRequestDetails);
        updateAuthorizationInfo(operation, httpRequestData, httpRequestDetails);
        return httpRequestDetails;
    }

    private byte[] filterRequestData(HttpRequestData httpRequestData, Operation operation, HttpHeaders headers, Map<String, Object> queryParameters, Map<String, String> pathParameters, byte[] requestBody) {
        for (Parameter parameter : operation.getParameters()) {
            String paramName = parameter.getName();
            String type = parameter.getIn().toUpperCase();
            if (ParameterType.HEADER.name().equals(type)) {
                List<String> headerValues = httpRequestData.getHttpHeaders().get(paramName);
                if (headerValues != null) {
                    headers.put(paramName, headerValues);
                }
            } else if (ParameterType.QUERY.name().equals(type)) {
                List<String> paramValues = httpRequestData.getQueryParametersMap().get(paramName);
                if (paramValues != null) {
                    queryParameters.put(paramName, paramValues);
                }
            } else if (ParameterType.PATH.name().equals(type)) {
                String pathVariableValue = httpRequestData.getPathVariablesMap().get(paramName);
                if (pathVariableValue != null) {
                    pathParameters.put(paramName, pathVariableValue);
                }
            } else if (ParameterType.BODY.name().equals(type)) {
                requestBody = httpRequestData.getRequestBody();
            }
        }
        return requestBody;
    }

    private String getEndPointAddress(Swagger swagger, String pathValue, Map<String, Object> queryParameters, Map<String, String> pathParameters) {
        String scheme = swagger.getSchemes().get(0).toValue();
        StringBuilder sb = new StringBuilder(scheme).append("://").append(swagger.getHost())
                .append(getNormalizedString(swagger.getBasePath())).append(getNormalizedString(pathValue));

        updateUrlWithQueryParameters(sb, queryParameters);

        StrSubstitutor strSubstitutor = new StrSubstitutor(pathParameters, "{", "}");
        String endpointAddress = strSubstitutor.replace(sb.toString());
        return endpointAddress;
    }

    private void updateUrlWithQueryParameters(StringBuilder endpointAddressSb, Map<String, Object> queryParameters) {
        boolean first = true;
        for (String queryParam : queryParameters.keySet()) {
            Object val = queryParameters.get(queryParam);
            String[] strings = WMUtils.getStringList(val);
            for (String str : strings) {
                if (first) {
                    endpointAddressSb.append("?");
                } else {
                    endpointAddressSb.append("&");
                }
                endpointAddressSb.append(queryParam).append("=").append(str);
                first = false;
            }
        }
    }

    private void updateProxyDetails(HttpRequestDetails httpRequestDetails) {
        boolean proxyEnabled = Boolean.valueOf(AppRuntimeProperties.getProperty(AppProxyConstants.APP_PROXY_ENABLED));
        if (proxyEnabled) {
            String proxyHost = AppRuntimeProperties.getProperty(AppProxyConstants.APP_PROXY_HOST);
            String port  = AppRuntimeProperties.getProperty(AppProxyConstants.APP_PROXY_PORT);
            int proxyPort=0;
            if(port!=null &&!( "".equals(port))){
                proxyPort=Integer.valueOf(port);
            }
            String proxyUsername = AppRuntimeProperties.getProperty(AppProxyConstants.APP_PROXY_USERNAME);
            String proxyPassword = AppRuntimeProperties.getProperty(AppProxyConstants.APP_PROXY_PASSWORD);
            httpRequestDetails.setProxy(new Proxy(proxyHost, proxyPort, proxyUsername, proxyPassword));
        }
    }

    private void updateAuthorizationInfo(Operation operation, HttpRequestData httpRequestData, HttpRequestDetails httpRequestDetails) {
        //check basic auth is there for operation
        List<Map<String, List<String>>> securityMap = operation.getSecurity();
        if (securityMap != null) {
            for (Map<String, List<String>> securityList : securityMap) {
                for (Map.Entry<String, List<String>> security : securityList.entrySet()) {
                    if (RestConstants.WM_REST_SERVICE_AUTH_NAME.equals(security.getKey())) {
                        String authorizationHeaderValue = httpRequestData.getHttpHeaders().getFirst(AUTHORIZATION);
                        if (authorizationHeaderValue == null) {
                            throw new WMRuntimeException("Authorization details are not specified in the request headers");
                        }
                        httpRequestDetails.getHeaders().set(RestConstants.AUTHORIZATION, authorizationHeaderValue);
                    }
                }
            }
        }
    }

    private Operation getOperation(Path path, String operationId) {
        for (Operation operation : path.getOperations()) {
            if (operation.getMethodName().equals(operationId)) {
                return operation;
            }
        }
        throw new WMRuntimeException("Operation does not exist with id " + operationId);
    }

    private String getNormalizedString(String str) {
        return (str != null) ? str.trim() : "";
    }

    private HttpResponseDetails invokeRestCall(HttpRequestDetails httpRequestDetails) {
        return new RestConnector().invokeRestCall(httpRequestDetails);
    }
}

