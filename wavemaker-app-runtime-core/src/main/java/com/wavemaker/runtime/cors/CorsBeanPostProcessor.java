package com.wavemaker.runtime.cors;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.ApplicationContext;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.model.security.CorsConfig;
import com.wavemaker.commons.model.security.PathEntry;

/**
 * Created by srujant on 5/7/17.
 */
public class CorsBeanPostProcessor implements BeanPostProcessor {

    private static final String DEFAULT_ALLOWED_METHODS = "GET,HEAD,POST";
    private static final String DEFAULT_ALLOWED_HEADERS = "*";
    private static final String DEFAULT_EXPOSED_HEADERS = "";
    private static final long DEFAULT_MAX_AGE = 1600;

    private RequestMappingHandlerMapping requestMappingHandlerMapping;


    @Autowired
    private ApplicationContext applicationContext;

    @PostConstruct
    public void init() {
        Map<String, RequestMappingHandlerMapping> handlerMappingMap = applicationContext.getBeansOfType(RequestMappingHandlerMapping.class);
        if (handlerMappingMap == null || handlerMappingMap.size() == 0) {
            throw new WMRuntimeException("No beans of type RequestMappingHandlerMapping found in " + applicationContext);
        } else {
            for (RequestMappingHandlerMapping bean : handlerMappingMap.values()) {
                if (bean.getApplicationContext() == applicationContext) {
                    requestMappingHandlerMapping = bean;
                    break;
                }
            }
            if (requestMappingHandlerMapping == null) {
                throw new WMRuntimeException("No beans of type RequestMappingHandlerMapping found in " + applicationContext);
            }
        }
    }

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof CorsConfig) {
            CorsConfig corsConfig = (CorsConfig) bean;
            if (corsConfig.isEnabled()) {
                Map<String, CorsConfiguration> corsConfigurationMap = getCorsConfigurations(corsConfig);
                requestMappingHandlerMapping.setCorsConfigurations(corsConfigurationMap);
            }
        }
        return bean;
    }

    private Map<String, CorsConfiguration> getCorsConfigurations(CorsConfig corsConfig) {

        List<PathEntry> pathEntriesList = corsConfig.getPathEntries();
        Long maxAge = corsConfig.getMaxAge();

        Map<String, CorsConfiguration> configurationMap = new LinkedHashMap<>();
        for (PathEntry pathEntry : pathEntriesList) {
            String path = pathEntry.getPath();
            if (StringUtils.isBlank(path)) {
                throw new WMRuntimeException("Path  cannot be empty for corsPathEntry "+pathEntry.getName());
            }
            CorsConfiguration corsConfiguration = buildCorsConfigurationObject(pathEntry, maxAge);
            configurationMap.put(path, corsConfiguration);
        }
        return configurationMap;
    }

    private CorsConfiguration buildCorsConfigurationObject(PathEntry pathEntry, Long maxAge) {
        CorsConfiguration corsConfiguration = new CorsConfiguration();

        if (maxAge == null) {
            maxAge = DEFAULT_MAX_AGE;
        }

        String allowedOrigins = pathEntry.getAllowedOrigins();
        if (StringUtils.isBlank(allowedOrigins)) {
            throw new WMRuntimeException("AllowedOrigins cannot be empty for corsPathEntry "+pathEntry.getName());
        }
        corsConfiguration.setMaxAge(maxAge);
        corsConfiguration.setAllowedOrigins(toList(allowedOrigins));
        corsConfiguration.setAllowedMethods(toList(DEFAULT_ALLOWED_METHODS));
        corsConfiguration.setAllowedHeaders(toList(DEFAULT_ALLOWED_HEADERS));
        corsConfiguration.setExposedHeaders(toList(DEFAULT_EXPOSED_HEADERS));
        corsConfiguration.setAllowCredentials(false);
        return corsConfiguration;
    }

    private List<String> toList(String inputString) {
        return Arrays.asList(StringUtils.split(inputString, ","));
    }


    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        return bean;
    }
}
