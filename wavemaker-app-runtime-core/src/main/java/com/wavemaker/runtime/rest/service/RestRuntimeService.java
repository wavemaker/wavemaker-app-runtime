package com.wavemaker.runtime.rest.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.text.StrSubstitutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;

import com.wavemaker.runtime.helper.SchemaConversionHelper;
import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.runtime.util.SwaggerDocUtil;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.json.JSONUtils;
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

    private Map<String, Swagger> swaggerDocumentCache = new HashMap<String, Swagger>();

    private static final String AUTHORIZATION = "authorization";

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
        Swagger swagger = getSwaggerDoc(serviceId);
        Map.Entry<String, Path> pathEntry = swagger.getPaths().entrySet().iterator().next();
        String relativePath = pathEntry.getKey();
        Path path = pathEntry.getValue();
        Operation operation = null;
        for (Operation eachOperation : path.getOperations()) {
            if (eachOperation.getOperationId().equals(operationId)) {
                operation = eachOperation;
                break;
            }
        }
        if (operation == null) {
            throw new WMRuntimeException("Operation does not exist with id " + operationId);
        }
        RestRequestInfo restRequestInfo = new RestRequestInfo();
        StringBuilder endpointAddressStringBuilder = new StringBuilder(swagger.getBasePath() + ((relativePath == null) ? "" : relativePath));
        String methodType = SwaggerDocUtil.getOperationType(path, operation.getOperationUid());
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

    private Swagger getSwaggerDoc(String serviceId) throws IOException {
        if (!swaggerDocumentCache.containsKey(serviceId)) {
            InputStream stream = null;
            try {
                stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(serviceId + "_apiDocument.json");
                Swagger swaggerDoc = JSONUtils.toObject(stream, Swagger.class);
                swaggerDocumentCache.put(serviceId, swaggerDoc);
            } finally {
                IOUtils.closeSilently(stream);
            }
        }
        return swaggerDocumentCache.get(serviceId);
    }
}
