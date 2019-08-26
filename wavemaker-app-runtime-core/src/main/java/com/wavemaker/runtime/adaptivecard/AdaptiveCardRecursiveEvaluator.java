package com.wavemaker.runtime.adaptivecard;

import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.LinkedMultiValueMap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.WMIOUtils;
import com.wavemaker.runtime.WMObjectMapper;
import com.wavemaker.runtime.rest.model.HttpRequestData;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;
import com.wavemaker.runtime.rest.service.RestRuntimeService;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.TemplateExceptionHandler;

public class AdaptiveCardRecursiveEvaluator {

    private static final String VARIABLES = "Variables";
    private static final String PAGE_PARAMS = "pageParams";
    private static final String SERVICE_TYPE = "serviceType";
    private static final String REST_SERVICE = "RestService";
    private static final String OPERATION_ID = "invoke";
    private static final String SERVICE_ID = "service";
    private static final String DATA_BINDINGS = "dataBinding";
    private static final String DATA_SET = "dataSet";
    private static final String DATA_BINDING_TARGET = "target";
    private static final String DATA_BINDING_VALUE = "value";
    private static final String FILE_SEPERATOR = "/";
    private static final Pattern pattern = Pattern.compile("(?<=Variables\\.)(\\w*)(?=\\.)*");
    @Autowired
    private RestRuntimeService restRuntimeService;
    private Configuration configuration = null;

    AdaptiveCardRecursiveEvaluator() {
        configuration = new Configuration(Configuration.VERSION_2_3_28);
        configuration.setDefaultEncoding("UTF-8");
        configuration.setLocale(Locale.US);
        configuration.setAPIBuiltinEnabled(true);
        configuration.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
    }


    public Map<String, Object> evaluate(Map<String, Object> variables, Map<String, String> pageParams) {
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            Map<String, Object> var = (Map<String, Object>) entry.getValue();
            var.put(DATA_SET, null);
        }
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            Set<String> invoked = new HashSet<>();
            invoke(variables, pageParams, invoked, entry.getKey());
        }
        return variables;
    }

    private Map<String, Object> invoke(Map<String, Object> variables, Map<String, String> pageParams, Set<String> visiting, String currVar) {
        Map<String, Object> varMap = (Map<String, Object>) variables.get(currVar);
        List<String> dependents = checkForDependents(varMap.get(DATA_BINDINGS));
        for (String s : dependents) {
            if (!visiting.contains(s)) {
                visiting.add(s);
            } else {
                throw new WMRuntimeException("circular dependency exists in variable invoke");
            }
            invoke(variables, pageParams, visiting, s);
            visiting.remove(s);
        }

        if (varMap.get(SERVICE_TYPE).equals(REST_SERVICE) && varMap.get(DATA_SET) == null) {
            Map<String, Object> modelInput = new HashMap<>();
            modelInput.put(VARIABLES, variables);
            modelInput.put(PAGE_PARAMS, pageParams);
            HttpResponseDetails httpResponseDetails = restRuntimeService.executeRestCall((String) varMap.get(SERVICE_ID),
                    OPERATION_ID, getQueryParams(varMap.get(DATA_BINDINGS), modelInput));
            if (httpResponseDetails.getStatusCode() == 200) {
                varMap.put(DATA_SET, streamToMap(httpResponseDetails.getBody()));
            }
            variables.put(currVar, varMap);
            return variables;
        }
        return variables;
    }

    private Map<String, Object> streamToMap(InputStream inputStream) {
        try {
            return WMObjectMapper.getInstance().readValue(inputStream, new TypeReference<Map<String, Object>>() {
            });
        } catch (IOException e) {
            throw new RuntimeException(e);
        } finally {
            WMIOUtils.closeSilently(inputStream);
        }
    }

    private HttpRequestData getQueryParams(Object node, Map<String, Object> modelInput) {

        HttpRequestData httpRequestData = new HttpRequestData();
        org.springframework.util.MultiValueMap<String, String> queryMap = new LinkedMultiValueMap<>();
        ((ArrayList) node).forEach((var) -> {
            Map<String, Object> variable = (Map<String, Object>) var;
            queryMap.put((String) variable.get(DATA_BINDING_TARGET), Collections.singletonList(evalExpression((String) variable.get(DATA_BINDING_VALUE),
                    modelInput)));
        });
        httpRequestData.setQueryParametersMap(queryMap);
        return httpRequestData;
    }

    private String evalExpression(String expression, Map<String, Object> modelInput) {
        if (expression.contains("bind:")) {
            expression = expression.replaceAll("bind:", "");
            expression = expression.replaceAll("\\$i", "0");
            String templateStr = "${" + expression + "}";
            try {
                Template template = new Template("name", new StringReader(templateStr), new Configuration(Configuration.VERSION_2_3_28));
                StringWriter writer = new StringWriter();
                template.process(modelInput, writer);
                return writer.toString();
            } catch (IOException | TemplateException e) {
                throw new RuntimeException(e);
            }
        }
        return expression;
    }

    private List<String> checkForDependents(Object node) {
        List<String> totalDependents = new ArrayList<>();
        ((ArrayList) node).forEach((var) -> {
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
