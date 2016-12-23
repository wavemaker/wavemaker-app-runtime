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
import java.io.InputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.text.StrSubstitutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;

import com.wavemaker.runtime.commons.model.Proxy;
import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.runtime.util.HttpRequestUtils;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.json.JSONUtils;
import com.wavemaker.studio.common.swaggerdoc.util.SwaggerDocUtil;
import com.wavemaker.studio.common.util.IOUtils;
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


    @Value("${app.proxy.enabled}")
    private boolean proxyEnabled;

    @Value("${app.proxy.host}")
    private String proxyHost;

    @Value("${app.proxy.port}")
    private int proxyPort;

    @Value("${app.proxy.username}")
    private String proxyUsername;

    @Value("${app.proxy.password}")
    private String proxyPassword;


    private Map<String, Swagger> swaggerDocumentCache = new HashMap<String, Swagger>();

    private static final String AUTHORIZATION = "authorization";

    private static final Logger logger = LoggerFactory.getLogger(RestRuntimeService.class);


    public RestResponse executeRestCall(String serviceId, String methodName, Map<String, Object> params, HttpServletRequest originRequest) throws IOException {
        RestRequestInfo restRequestInfo = getRestRequestInfo(serviceId, methodName, params, originRequest);
        logger.debug("Rest service request details {}", restRequestInfo.toString());
        RestResponse restResponse = invokeRestCall(restRequestInfo);
        logger.debug("Rest service response details for the endpoint {} is {}", restRequestInfo.getEndpointAddress(), restResponse.toString());
        return restResponse;
    }

    private RestResponse invokeRestCall(RestRequestInfo restRequestInfo) {
        return new RestConnector().invokeRestCall(restRequestInfo);
    }

    private RestRequestInfo getRestRequestInfo(String serviceId, String methodName, Map<String, Object> params, HttpServletRequest originRequest) throws IOException {
        Swagger swagger = getSwaggerDoc(serviceId);
        Map.Entry<String, Path> pathEntry = swagger.getPaths().entrySet().iterator().next();
        String pathValue = pathEntry.getKey();
        Path path = pathEntry.getValue();
        Operation operation = null;
        for (Operation eachOperation : path.getOperations()) {
            if (eachOperation.getMethodName().equals(methodName)) {
                operation = eachOperation;
                break;
            }
        }
        if (operation == null) {
            throw new WMRuntimeException("Operation does not exist with id " + methodName);
        }
        RestRequestInfo restRequestInfo = new RestRequestInfo();
        final String scheme = swagger.getSchemes().get(0).toValue();
        StringBuilder endpointAddressStringBuilder = new StringBuilder(scheme).append("://").append(swagger.getHost())
                .append(getNormalizedString(swagger.getBasePath())).append(getNormalizedString(pathValue));
        String methodType = SwaggerDocUtil.getOperationType(path, operation.getOperationId());
        restRequestInfo.setMethod(methodType.toUpperCase());
        List<String> consumes = operation.getConsumes();
        if (consumes != null && !consumes.isEmpty()) {
            restRequestInfo.setContentType(consumes.iterator().next());
        }

        //check basic auth is there for operation
        List<Map<String, List<String>>> securityMap = operation.getSecurity();
        if (securityMap != null) {
            for (Map<String, List<String>> securityList : securityMap) {
                for (Map.Entry<String, List<String>> security : securityList.entrySet()) {
                    if (RestConstants.WM_REST_SERVICE_AUTH_NAME.equals(security.getKey())) {
                        if (params.get(AUTHORIZATION) == null) {
                            throw new WMRuntimeException("Authorization details are not specified in the request headers");
                        }
                        restRequestInfo.setBasicAuthorization(params.get(AUTHORIZATION).toString());
                    }
                }
            }
        }

        List<Parameter> parameters = operation.getParameters();
        Map<String, Object> headers = (restRequestInfo.getHeaders() == null) ? new HashMap<String, Object>() : restRequestInfo.getHeaders();
        Map<String, Object> queryParams = new HashMap<>();
        Map<String, String> pathParams = new HashMap<>();
        String requestBody = null;
        if (params != null) {
            Set<String> unboundedQueryParams = new HashSet();
            for (Parameter parameter : parameters) {
                String paramName = parameter.getName();
                Object value = params.get(paramName);
                String type = parameter.getIn().toUpperCase();
                if (value == null && ParameterType.HEADER.name().equals(type)) {//This is to handle header rename to lower case letters in some webapp servers
                    value = params.get(paramName.toLowerCase());
                }
                if (value == null && ParameterType.BODY.name().equals(type)) {//This is to handle body parameter which might not have been named in some api-docs
                    value = params.get(RestConstants.REQUEST_BODY_KEY);
                }
                if (value != null) {
                    if (ParameterType.HEADER.name().equals(type)) {
                        headers.put(paramName, value);
                    } else if (ParameterType.QUERY.name().equals(type)) {
                        queryParams.put(paramName, value);
                    } else if (ParameterType.PATH.name().equals(type)) {
                        pathParams.put(paramName, (String) value);
                    } else if (ParameterType.BODY.name().equals(type)) {
                        requestBody = (String) value;
                    }
                } else if(ParameterType.QUERY.name().equals(type)) {
                    unboundedQueryParams.add(paramName);
                }
            }

            if (StringUtils.isNotBlank(requestBody) && isFormUrlencodedContentType(restRequestInfo.getContentType())) {
                for (String unboundedQueryParam : unboundedQueryParams) {
                    Map<String, Object> map = HttpRequestUtils.getFormUrlencodedDataAsMap(requestBody);
                    Object value = map.get(unboundedQueryParam);
                    if (value != null) {
                        queryParams.put(unboundedQueryParam, value);
                    }
                }
            }
        }

        String[] defaultHeaders = {"User-Agent"};
        for (String headerKey : defaultHeaders) {
            if (!headers.containsKey(headerKey)) {
                String headerValue = originRequest.getHeader(headerKey);
                if (org.apache.commons.lang3.StringUtils.isNotBlank(headerValue)) {
                    headers.put(headerKey, headerValue);
                }
            }
        }

        boolean first = true;
        for (String queryParam : queryParams.keySet()) {
            Object val = queryParams.get(queryParam);
            String[] strings = WMUtils.getStringList(val);
            for (String str : strings) {
                if (first) {
                    endpointAddressStringBuilder.append("?");
                } else {
                    endpointAddressStringBuilder.append("&");
                }
                endpointAddressStringBuilder.append(queryParam).append("=").append(str);
                first = false;
            }
        }

        if (proxyEnabled) {
            restRequestInfo.setProxy(new Proxy(proxyHost, proxyPort, proxyUsername, proxyPassword));
        }

        StrSubstitutor strSubstitutor = new StrSubstitutor(pathParams, "{", "}");
        String endpointAddress = strSubstitutor.replace(endpointAddressStringBuilder.toString());
        restRequestInfo.setRequestBody(requestBody);
        restRequestInfo.setHeaders(headers);
        restRequestInfo.setEndpointAddress(endpointAddress);
        return restRequestInfo;
    }

    private Swagger getSwaggerDoc(String serviceId) throws IOException {
        if (!swaggerDocumentCache.containsKey(serviceId)) {
            InputStream stream = null;
            try {
                stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(serviceId + "_apiTarget.json");
                Swagger swaggerDoc = JSONUtils.toObject(stream, Swagger.class);
                swaggerDocumentCache.put(serviceId, swaggerDoc);
            } finally {
                IOUtils.closeSilently(stream);
            }
        }
        return swaggerDocumentCache.get(serviceId);
    }

    private String getNormalizedString(String str) {
        return (str != null) ? str.trim() : "";
    }

    private boolean isFormUrlencodedContentType(String contentType) {
        return StringUtils.equals(MediaType.APPLICATION_FORM_URLENCODED_VALUE, contentType);
    }

}

