package com.wavemaker.runtime.adaptivecard;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.servicedef.model.Parameter;
import com.wavemaker.commons.servicedef.model.ServiceDefinition;
import com.wavemaker.runtime.rest.model.HttpRequestDetails;

public class HttpRequestDetailsBuilder {


    private static final String QUERY = "query";
    private static final String HEADER = "header";
    private static final String PATH = "path";
    private static final String BODY = "body";

    private static final String DATA_BINDING_TARGET = "target";
    private static final String DATA_BINDING_VALUE = "value";

    private static final String EQUALS = "=";

    private HttpRequestDetailsBuilder() {

    }

    public static HttpRequestDetails construct(Object node, Map<String, Object> modelInput, ServiceDefinition serviceDefinition) {
        if (serviceDefinition != null) {
            return constructingParameters(node, modelInput, serviceDefinition);
        } else {
            throw new WMRuntimeException("");
            //todo :: throw..
        }
    }

    private static HttpRequestDetails constructingParameters(Object node, Map<String, Object> modelInput, ServiceDefinition serviceDefinition) {

        Map<String, String> parameterMap = getParameterMap(serviceDefinition);

        HttpRequestDetails httpRequestDetails = new HttpRequestDetails();
        List<String> queryParamsList = new ArrayList<>();
        Map<String, String> pathParamMap = new HashMap<>();

        if (parameterMap != null) {
            HttpHeaders headers = new HttpHeaders();

            ((Collection) node).forEach(var -> {
                Map<String, Object> variable = (Map<String, Object>) var;
                if (parameterMap.containsKey(variable.get(DATA_BINDING_TARGET))) {
                    String parameterType = parameterMap.get(variable.get(DATA_BINDING_TARGET));
                    if (QUERY.equals(parameterType)) {
                        queryParamsList.add(variable.get(DATA_BINDING_TARGET) + EQUALS +
                                ExpressionEvaluator.evalExpression((String) variable.get(DATA_BINDING_VALUE), modelInput));

                    } else if (HEADER.equals(parameterType)) {
                        headers.add((String) variable.get(DATA_BINDING_TARGET),
                                ExpressionEvaluator.evalExpression((String) variable.get(DATA_BINDING_VALUE), modelInput));

                    } else if (PATH.equals(parameterType)) {
                        pathParamMap.put((String) variable.get(DATA_BINDING_TARGET),
                                ExpressionEvaluator.evalExpression((String) variable.get(DATA_BINDING_VALUE), modelInput));

                    } else if (BODY.equals(parameterType)) {
                        String body = (String) variable.get(DATA_BINDING_VALUE);
                        httpRequestDetails.setBody(new ByteArrayInputStream(body.getBytes()));
                        if (!serviceDefinition.getWmServiceOperationInfo().getConsumes().isEmpty()) {
                            headers.add(HttpHeaders.CONTENT_TYPE,
                                    serviceDefinition.getWmServiceOperationInfo().getConsumes().stream().collect(Collectors.joining(",")));
                        } else {
                            headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
                        }
                    }
                }
            });
            httpRequestDetails.setHeaders(headers);
        }
        httpRequestDetails.setEndpointAddress(getEndpointAddress(serviceDefinition, pathParamMap, queryParamsList));
        httpRequestDetails.setMethod(serviceDefinition.getWmServiceOperationInfo().getHttpMethod().toUpperCase());
        return httpRequestDetails;
    }

    private static Map<String, String> getParameterMap(ServiceDefinition serviceDefinition) {
        List<Parameter> parameterList = serviceDefinition.getWmServiceOperationInfo().getParameters();
        Map<String, String> parameterMap = null;
        if (!parameterList.isEmpty()) {
            parameterMap = serviceDefinition.getWmServiceOperationInfo().getParameters().stream().collect(Collectors.toMap
                    (Parameter::getName, Parameter::getParameterType));
        }
        return parameterMap;
    }

    private static String getEndpointAddress(ServiceDefinition serviceDefinition, Map<String, String> pathParamMap, List<String> queryParamList) {
        String endpointAddress = serviceDefinition.getWmServiceOperationInfo().getRelativePath();
        if (!pathParamMap.isEmpty()) {
            endpointAddress = setPathParamToEndpoint(endpointAddress, pathParamMap);
        }
        if (!queryParamList.isEmpty()) {
            endpointAddress = setQueryParamToEndpointAddress(endpointAddress, queryParamList);
        }
        return endpointAddress;
    }

    private static String setQueryParamToEndpointAddress(String endpointAddress, List<String> queryParamList) {
        return endpointAddress + "?" + queryParamList.stream().collect(Collectors.joining("&"));
    }

    private static String setPathParamToEndpoint(String endpointAddress, Map<String, String> pathParamMap) {
        for (Map.Entry<String, String> entry : pathParamMap.entrySet()) {
            endpointAddress = buildAndExpand(endpointAddress, entry.getKey(), entry.getValue());
        }
        return endpointAddress;
    }

    private static String buildAndExpand(String endpointAddress, String replacable, String value) {
        replacable = "{" + replacable + "}";
        return endpointAddress.replace(replacable, value);
    }
}
