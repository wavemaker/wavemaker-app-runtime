package com.wavemaker.runtime.rest.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang.text.StrSubstitutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.util.Assert;

import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.WMUtils;
import com.wavemaker.runtime.WMObjectMapper;
import com.wavemaker.runtime.helper.SchemaConversionHelper;
import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.runtime.rest.model.api.ApiDocument;
import com.wavemaker.runtime.rest.model.api.DataFormat;
import com.wavemaker.runtime.rest.model.api.EndPoint;
import com.wavemaker.runtime.rest.model.api.HTTPMethod;
import com.wavemaker.runtime.rest.model.api.Operation;
import com.wavemaker.runtime.rest.model.api.Parameter;
import com.wavemaker.runtime.rest.model.api.ParameterType;

/**
 * @author Uday Shankar
 */
public class RestRuntimeService {

    private Map<String, ApiDocument> apiDocumentCache = new HashMap<String, ApiDocument>();

    private static final Logger logger = LoggerFactory.getLogger(RestRuntimeService.class);

    public RestResponse executeRestCall(String serviceId, String operationId, Map<String, String> params) throws IOException {
        RestRequestInfo restRequestInfo = getRestRequestInfo(serviceId, operationId, params);
        RestResponse restResponse = new RestConnector().invokeRestCall(restRequestInfo);
        String responseBody = restResponse.getResponseBody();
        if(restResponse.getContentType() != null) {
            MediaType responseContentType = MediaType.parseMediaType(restResponse.getContentType());
            if (WMUtils.isXmlMediaType(responseContentType)) {
                restResponse.setConvertedResponse(SchemaConversionHelper.convertXmlToJson(responseBody).v2.toString());
            } else if(!WMUtils.isJsonMediaType(responseContentType)) {
                try {//trying if the content is of xml type
                    restResponse.setConvertedResponse(SchemaConversionHelper.convertXmlToJson(responseBody).v2.toString());
                } catch (Exception e) {
                    logger.debug("Unable to read the response as xml for the media type [" + responseContentType + "] and convert to json",e);
                }
            }
        }
        if(restResponse.getConvertedResponse() != null) {
            restResponse.setResponseBody(null);
        }
        return restResponse;
    }

    private RestRequestInfo getRestRequestInfo(String serviceId, String operationId, Map<String, String> params) throws IOException {
        ApiDocument apiDocument = getApiDocument(serviceId);
        Operation operation = getOperationById(apiDocument, operationId);
        if (operation == null) {
            throw new WMRuntimeException("Invalid operationId [" + operationId + "]");
        }
        RestRequestInfo restRequestInfo = new RestRequestInfo();
        StringBuilder endpointAddressStringBuilder = new StringBuilder(apiDocument.getBaseURL() + operation.getRelativePath());
        restRequestInfo.setMethod(operation.getHttpMethod().toString());
        List<DataFormat> consumes = operation.getConsumes();
        Assert.isTrue(consumes.size() <= 1);
        if(!consumes.isEmpty()) {
            DataFormat dataFormat = consumes.get(0);
            restRequestInfo.setContentType(dataFormat.getFormat());
        }
        List<Parameter> parameters = operation.getParameters();
        Map<String, String> headers = new HashMap<String, String>();
        Map<String, String> queryParams = new HashMap<String, String>();
        Map<String, String> pathParams = new HashMap<String, String>();
        String requestBody = null;
        if(params != null){
            for(Parameter parameter : parameters) {
                String paramName = parameter.getName();
                String value = params.get(paramName);
                if(ParameterType.HEADER.equals(parameter.getParameterType())) {
                    if(params.containsKey(paramName)) {
                        headers.put(paramName, value);
                    }
                } else if(ParameterType.QUERY.equals(parameter.getParameterType())) {
                    if(params.containsKey(paramName)) {
                        queryParams.put(paramName, value);
                    }
                } else if(ParameterType.PATH.equals(parameter.getParameterType())) {
                    if(params.containsKey(paramName)) {
                        pathParams.put(paramName, value);
                    }
                } else if(ParameterType.BODY.equals(parameter.getParameterType())) {
                    if(params.containsKey(paramName)) {
                        requestBody = value;
                    }
                } else if (ParameterType.AUTH.equals(parameter.getParameterType())) {
                    restRequestInfo.setBasicAuth(true);
                    if (RestConstants.AUTH_USER_NAME.equals(paramName)) {
                        restRequestInfo.setUserName(params.get(RestConstants.AUTH_USER_NAME));
                    } else if (RestConstants.AUTH_PASSWORD.equals(paramName)) {
                        restRequestInfo.setPassword(params.get(RestConstants.AUTH_PASSWORD));
                    }
                }
            }

        }
        boolean first = true;
        for(String queryParam : queryParams.keySet()) {
            if(first) {
                endpointAddressStringBuilder.append("?");
            } else {
                endpointAddressStringBuilder.append("&");
            }
            endpointAddressStringBuilder.append(queryParam).append("=").append(queryParams.get(queryParam));
            first = false;
        }
        StrSubstitutor strSubstitutor = new StrSubstitutor(pathParams, "{", "}");
        String endpointAddress = strSubstitutor.replace(endpointAddressStringBuilder.toString());
        restRequestInfo.setRequestBody(requestBody);
        restRequestInfo.setHeaders(headers);
        restRequestInfo.setEndpointAddress(endpointAddress);
        return restRequestInfo;
    }

    private Operation getOperationById(ApiDocument apiDocument, String operationId) {
        List<EndPoint> endPoints = apiDocument.getEndPoints();
        for ( EndPoint endPoint : endPoints) {
            List<Operation> operations = endPoint.getOperations();
            for(Operation operation : operations) {
                if(operation.getName().equals(operationId)) {
                    return operation;
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
