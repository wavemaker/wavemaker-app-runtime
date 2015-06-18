package com.wavemaker.runtime.rest.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.lang3.text.StrSubstitutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.util.Assert;

import com.wavemaker.runtime.WMObjectMapper;
import com.wavemaker.runtime.helper.SchemaConversionHelper;
import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.WMUtils;
import com.wavemaker.tools.api.core.models.ApiDocument;
import com.wavemaker.tools.api.core.models.EndPoint;
import com.wavemaker.tools.api.core.models.HTTPMethod;
import com.wavemaker.tools.api.core.models.Operation;
import com.wavemaker.tools.api.core.models.Parameter;
import com.wavemaker.tools.api.core.models.ParameterType;

/**
 * @author Uday Shankar
 */
public class RestRuntimeService {

    private Map<String, ApiDocument> apiDocumentCache = new HashMap<String, ApiDocument>();

    private static final Logger logger = LoggerFactory.getLogger(RestRuntimeService.class);

    public RestResponse executeRestCall(String serviceId, String operationId, Map<String, Object> params) throws IOException {
        RestRequestInfo restRequestInfo = getRestRequestInfo(serviceId, operationId, params);
        RestResponse restResponse = new RestConnector().invokeRestCall(restRequestInfo);
        String responseBody = restResponse.getResponseBody();
        if (restResponse.getContentType() != null) {
            MediaType responseContentType = MediaType.parseMediaType(restResponse.getContentType());
            if (WMUtils.isXmlMediaType(responseContentType)) {
                restResponse.setConvertedResponse(SchemaConversionHelper.convertXmlToJson(responseBody).v2.toString());
                restResponse.setContentType(MediaType.APPLICATION_JSON.toString());
            } else if (!WMUtils.isJsonMediaType(responseContentType)) {
                try {//trying if the content is of xml type
                    restResponse.setConvertedResponse(SchemaConversionHelper.convertXmlToJson(responseBody).v2.toString());
                    restResponse.setContentType(MediaType.APPLICATION_JSON.toString());
                } catch (Exception e) {
                    logger.debug("Unable to read the response as xml for the media type {} and convert to json", responseContentType, e);
                }
            } else {
                restResponse.setContentType(MediaType.APPLICATION_JSON.toString());
            }
        }
        if (restResponse.getConvertedResponse() != null) {
            restResponse.setResponseBody(null);
        }
        return restResponse;
    }

    private RestRequestInfo getRestRequestInfo(String serviceId, String operationId, Map<String, Object> params) throws IOException {
        ApiDocument apiDocument = getApiDocument(serviceId);
        EndPoint endPoint = getEndPointByOperationId(apiDocument, operationId);
        if (endPoint == null) {
            throw new WMRuntimeException("Invalid operationId [" + operationId + "]");
        }
        Operation operation = getOperationById(endPoint, operationId);
        RestRequestInfo restRequestInfo = new RestRequestInfo();
        StringBuilder endpointAddressStringBuilder = new StringBuilder(apiDocument.getBaseURL() + endPoint.getRelativePath());
        restRequestInfo.setMethod(operation.getHttpMethod().toString());
        Set<String> consumes = operation.getConsumes();
        Assert.isTrue(consumes.size() <= 1);
        if (!consumes.isEmpty()) {
            restRequestInfo.setContentType(consumes.iterator().next());
        }
        List<Parameter> parameters = operation.getParameters();
        Map<String, Object> headers = new HashMap<>();
        Map<String, Object> queryParams = new HashMap<>();
        Map<String, String> pathParams = new HashMap<>();
        String requestBody = null;
        if (params != null) {
            for (Parameter parameter : parameters) {
                String paramName = parameter.getName();
                Object value = params.get(paramName);
                if (value == null && ParameterType.HEADER.equals(parameter.getParameterType())) {//This is to handle header rename to lower case letters in some webapp servers
                    value = params.get(paramName.toLowerCase());
                }
                if (value == null && ParameterType.BODY.equals(parameter.getParameterType())) {//This is to handle body parameter which might not have been named in some api-docs
                    value = params.get(RestConstants.REQUEST_BODY_KEY);
                }
                if (value != null) {
                    if (ParameterType.HEADER.equals(parameter.getParameterType())) {
                        headers.put(paramName, value);
                    } else if (ParameterType.QUERY.equals(parameter.getParameterType())) {
                        queryParams.put(paramName, value);
                    } else if (ParameterType.PATH.equals(parameter.getParameterType())) {
                        pathParams.put(paramName, (String) value);
                    } else if (ParameterType.BODY.equals(parameter.getParameterType())) {
                        requestBody = (String) value;
                    } else if (ParameterType.AUTH.equals(parameter.getParameterType())) {
                        restRequestInfo.setBasicAuth(true);
                        if (RestConstants.AUTH_USER_NAME.equals(paramName)) {
                            restRequestInfo.setUserName((String) params.get(RestConstants.AUTH_USER_NAME));
                        } else if (RestConstants.AUTH_PASSWORD.equals(paramName)) {
                            restRequestInfo.setPassword((String) params.get(RestConstants.AUTH_PASSWORD));
                        }
                    }
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
        StrSubstitutor strSubstitutor = new StrSubstitutor(pathParams, "{", "}");
        String endpointAddress = strSubstitutor.replace(endpointAddressStringBuilder.toString());
        restRequestInfo.setRequestBody(requestBody);
        restRequestInfo.setHeaders(headers);
        restRequestInfo.setEndpointAddress(endpointAddress);
        return restRequestInfo;
    }

    private Operation getOperationById(EndPoint endPoint, String operationId) {
        List<Operation> operations = endPoint.getOperations();
        for (Operation operation : operations) {
            if (operation.getName().equals(operationId)) {
                return operation;
            }
        }
        return null;
    }

    private Operation getOperationById(ApiDocument apiDocument, String operationId) {
        List<EndPoint> endPoints = apiDocument.getEndPoints();
        for (EndPoint endPoint : endPoints) {
            List<Operation> operations = endPoint.getOperations();
            for (Operation operation : operations) {
                if (operation.getName().equals(operationId)) {
                    return operation;
                }
            }
        }
        return null;
    }

    private EndPoint getEndPointByOperationId(ApiDocument apiDocument, String operationId) {
        List<EndPoint> endPoints = apiDocument.getEndPoints();
        for (EndPoint endPoint : endPoints) {
            List<Operation> operations = endPoint.getOperations();
            for (Operation operation : operations) {
                if (operation.getName().equals(operationId)) {
                    return endPoint;
                }
            }
        }
        return null;
    }

    private ApiDocument getApiDocument(String serviceId) throws IOException {
        if (!apiDocumentCache.containsKey(serviceId)) {
            InputStream stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(serviceId + "_apiDocument.json");
            ApiDocument apiDocument = WMObjectMapper.getInstance().readValue(stream, ApiDocument.class);
            apiDocumentCache.put(serviceId, apiDocument);
        }
        return apiDocumentCache.get(serviceId);
    }

    public void validateOperation(String serviceId, String operationId, String method) throws IOException {
        ApiDocument apiDocument = getApiDocument(serviceId);
        Operation operation = getOperationById(apiDocument, operationId);
        if (operation == null) {
            throw new WMRuntimeException("Invalid operationId [" + operationId + "]");
        }
        HTTPMethod httpMethod = operation.getHttpMethod();
        if (httpMethod != null && !httpMethod.name().equalsIgnoreCase(method)) {
            throw new WMRuntimeException("Method [" + method + "] is not allowed to execute the operation [" + operationId + "] in the service [" + serviceId + "]");
        }
    }
}
