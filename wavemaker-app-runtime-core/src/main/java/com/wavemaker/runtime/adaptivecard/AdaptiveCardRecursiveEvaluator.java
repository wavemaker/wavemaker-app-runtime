package com.wavemaker.runtime.adaptivecard;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.servicedef.model.ServiceDefinition;
import com.wavemaker.commons.util.WMIOUtils;
import com.wavemaker.runtime.WMObjectMapper;
import com.wavemaker.runtime.rest.model.HttpRequestDetails;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;
import com.wavemaker.runtime.rest.service.RestConnector;
import com.wavemaker.runtime.servicedef.service.ServiceDefinitionService;

public class AdaptiveCardRecursiveEvaluator {

    private static final String VARIABLES = "Variables";
    private static final String PAGE_PARAMS = "pageParams";
    private static final String DATA_BINDINGS = "dataBinding";
    private static final String DATA_SET = "dataSet";
    private static final String DATA_BINDING_VALUE = "value";
    private static final String OPERATION_ID = "operationId";

    private static final Pattern pattern = Pattern.compile("(?<=Variables\\.)(\\w*)(?=\\.)*");

    @Autowired
    private ServiceDefinitionService serviceDefinitionService;

    public Map<String, Object> evaluate(Map<String, Object> variables, Map<String, String> pageParams, String hostAddress) {
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            Map<String, Object> var = (Map<String, Object>) entry.getValue();
            var.put(DATA_SET, null);
        }
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            Set<String> invoked = new HashSet<>();
            invoke(variables, pageParams, invoked, entry.getKey(), hostAddress);
        }
        return variables;
    }

    private Map<String, Object> invoke(Map<String, Object> variables, Map<String, String> pageParams,
                                       Set<String> visiting, String currVar, String hostAddress) {
        Map<String, Object> varMap = (Map<String, Object>) variables.get(currVar);
        List<String> dependents = checkForDependents(varMap.get(DATA_BINDINGS));
        for (String s : dependents) {
            if (!visiting.contains(s)) {
                visiting.add(s);
            } else {
                throw new WMRuntimeException("circular dependency exists in variable invoke");
            }
            invoke(variables, pageParams, visiting, s, hostAddress);
            visiting.remove(s);
        }
        Map<String, Object> modelInput = new HashMap<>();
        modelInput.put(VARIABLES, variables);
        modelInput.put(PAGE_PARAMS, pageParams);

        variables.put(currVar, variableRequestHandler(varMap, modelInput, hostAddress));
        return variables;
    }

    private Map<String, Object> variableRequestHandler(Map<String, Object> varMap, Map<String, Object> modelInput, String hostAddress) {

        if (varMap.get(DATA_SET) == null) {
            Map<String, ServiceDefinition> definitionMap = serviceDefinitionService.listServiceDefs();
            ServiceDefinition serviceDefinition = definitionMap.get(varMap.get(OPERATION_ID));
            HttpRequestDetails httpRequestDetails = HttpRequestDetailsBuilder.construct(varMap.get(DATA_BINDINGS), modelInput, serviceDefinition);

            String endpointAddress = httpRequestDetails.getEndpointAddress();
            httpRequestDetails.setEndpointAddress(hostAddress + endpointAddress);

            return variableInvoker(httpRequestDetails, varMap, serviceDefinition);
        }
        return varMap;
    }

    private Map<String, Object> variableInvoker(HttpRequestDetails httpRequestDetails, Map<String, Object> varMap, ServiceDefinition serviceDefinition) {
        RestConnector connector = new RestConnector();
        HttpResponseDetails httpResponseDetails = connector.invokeRestCall(httpRequestDetails);
        if (httpResponseDetails.getStatusCode() == 200) {
            if (checkForOperationType(serviceDefinition.getOperationType())) {
                Map<String, Object> serviceOutMap = new HashMap<>();
                serviceOutMap.put("value", WMIOUtils.toString(httpResponseDetails.getBody()));
                varMap.put(DATA_SET, serviceOutMap);
            } else if (serviceDefinition.getOperationType().equals("array")) {
                if (checkForOperationType((String) varMap.get("type"))) {
                    Map<String, Object> serviceOutMap = new HashMap<>();
                    serviceOutMap.put("value", streamToArray(httpResponseDetails.getBody()));
                    varMap.put(DATA_SET, serviceOutMap);
                } else {
                    varMap.put(DATA_SET, streamToArray(httpResponseDetails.getBody()));
                }
            } else {
                varMap.put(DATA_SET, streamToMap(httpResponseDetails.getBody()));
            }
        } else {
            throw new WMRuntimeException("failed to invoke variable : " + varMap.get("name"));
        }
        return varMap;
    }

    private boolean checkForOperationType(String operationType) {
        return operationType.equals("string") || operationType.equals("integer") || operationType.equals("number") ||
                operationType.equals("boolean");
    }

    private List<Object> streamToArray(InputStream inputStream) {
        try {
            return WMObjectMapper.getInstance().readValue(inputStream, new TypeReference<List<Object>>() {
            });
        } catch (IOException e) {
            throw new WMRuntimeException("failed to parse input stream to array", e);
        } finally {
            WMIOUtils.closeSilently(inputStream);
        }
    }

    private Map<String, Object> streamToMap(InputStream inputStream) {
        try {
            return WMObjectMapper.getInstance().readValue(inputStream, new TypeReference<Map<String, Object>>() {
            });
        } catch (IOException e) {
            throw new WMRuntimeException("failed to parse input stream to Map", e);
        } finally {
            WMIOUtils.closeSilently(inputStream);
        }
    }

    @SuppressWarnings(value = "unchecked")
    private List<String> checkForDependents(Object node) {
        List<String> totalDependents = new ArrayList<>();
        ((ArrayList) node).forEach(var -> {
            Map<String, Object> variable = (Map<String, Object>) var;
            List<String> dependents = getDependents((String) variable.get(DATA_BINDING_VALUE));
            totalDependents.addAll(dependents);
        });
        return totalDependents;
    }

    private List<String> getDependents(String expression) {
        Matcher matcher = pattern.matcher(expression);
        List<String> dependents = new ArrayList<>();
        while (matcher.find()) {
            dependents.add(matcher.group());
        }
        return dependents;
    }
}
