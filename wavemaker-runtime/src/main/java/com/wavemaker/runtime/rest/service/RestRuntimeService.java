package com.wavemaker.runtime.rest.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang.text.StrSubstitutor;
import org.codehaus.jackson.map.ObjectMapper;
import org.springframework.util.Assert;

import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.api.ApiDocument;
import com.wavemaker.runtime.rest.model.api.DataFormat;
import com.wavemaker.runtime.rest.model.api.EndPoint;
import com.wavemaker.runtime.rest.model.api.Operation;
import com.wavemaker.runtime.rest.model.api.Parameter;
import com.wavemaker.runtime.rest.model.api.ParameterType;

/**
 * @author Uday Shankar
 */
public class RestRuntimeService {

    private Map<String, ApiDocument> apiDocumentCache = new HashMap<String, ApiDocument>();

    public RestRequestInfo getRestRequestInfo(String serviceId, String operationId, Map<String, String> params) throws IOException {
        ApiDocument apiDocument = getApiDocument(serviceId);
        Operation operation = getOperationById(apiDocument, operationId);
        if (operation == null) {
            throw new WMRuntimeException("Invalid operationId [" + operationId + "]");
        }
        RestRequestInfo restRequestInfo = new RestRequestInfo();
        StringBuilder endpointAddressStringBuilder = new StringBuilder(apiDocument.getBaseURL() + operation.getRelativePath());
        restRequestInfo.setMethod(operation.getHttpMethod().toString());
        restRequestInfo.setBasicAuth(operation.isBasicAuth());
        restRequestInfo.setUserName(operation.getUserName());
        restRequestInfo.setPassword(operation.getPassword());
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
        for(Parameter parameter : parameters) {
            if(ParameterType.HEADER.equals(parameter.getParameterType()))  {
                if(params.containsKey(parameter.getName())) {
                    headers.put(parameter.getName(), params.get(parameter.getName()));
                }
            } else if(ParameterType.QUERY.equals(parameter.getParameterType())) {
                if(params.containsKey(parameter.getName())) {
                    queryParams.put(parameter.getName(), params.get(parameter.getName()));
                }
            } else if(ParameterType.PATH.equals(parameter.getParameterType())) {
                if(params.containsKey(parameter.getName())) {
                    pathParams.put(parameter.getName(), params.get(parameter.getName()));
                }
            } else if(ParameterType.BODY.equals(parameter.getParameterType())) {
                if(!params.containsKey(parameter.getName())) {
                    requestBody = params.get(parameter.getName());
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
            InputStream stream = RestRuntimeService.class.getClassLoader().getResourceAsStream(serviceId + "_apiDocument.json");
            ApiDocument apiDocument = new ObjectMapper().readValue(stream, ApiDocument.class);
            apiDocumentCache.put(serviceId, apiDocument);
        }
        return apiDocumentCache.get(serviceId);
    }

}
