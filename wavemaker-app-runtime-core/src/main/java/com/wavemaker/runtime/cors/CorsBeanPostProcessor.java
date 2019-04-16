package com.wavemaker.runtime.cors;

import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.ApplicationContext;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.model.security.CorsConfig;
import com.wavemaker.commons.model.security.PathEntry;

/**
 * Registers all {@link CorsConfig} beans configured in the app using
 * {@link org.springframework.web.cors.UrlBasedCorsConfigurationSource#registerCorsConfiguration(String, CorsConfiguration)}.
 *
 * @author  srujant on 5/7/17.
 */
public class CorsBeanPostProcessor implements BeanPostProcessor {

    private static final String DEFAULT_ALLOWED_METHODS = "GET,HEAD,POST";
    private static final String DEFAULT_ALLOWED_HEADERS = "*";
    private static final String DEFAULT_EXPOSED_HEADERS = "";
    private static final long DEFAULT_MAX_AGE = 1600;

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Autowired
    private ApplicationContext applicationContext;

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        if (bean instanceof CorsConfig) {
            CorsConfig corsConfig = (CorsConfig) bean;
            if (corsConfig.isEnabled()) {
                initializeCorsConfiguration(corsConfig);
            }
        }
        return bean;
    }

    private void initializeCorsConfiguration(CorsConfig corsConfig) {

        List<PathEntry> pathEntriesList = corsConfig.getPathEntries();
        Long maxAge = corsConfig.getMaxAge();
        boolean allowCredentials = corsConfig.isAllowCredentials();

        for (PathEntry pathEntry : pathEntriesList) {
            String path = pathEntry.getPath();
            if (StringUtils.isBlank(path)) {
                throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.path.cannot.be.empty"), pathEntry.getName());
            }
            CorsConfiguration corsConfiguration = buildCorsConfigurationObject(pathEntry, maxAge, allowCredentials);
            ((UrlBasedCorsConfigurationSource) corsConfigurationSource).registerCorsConfiguration(path, corsConfiguration);
        }
    }

    private CorsConfiguration buildCorsConfigurationObject(PathEntry pathEntry, Long maxAge, boolean allowCredentials) {
        CorsConfiguration corsConfiguration = new CorsConfiguration();

        if (maxAge == null) {
            maxAge = DEFAULT_MAX_AGE;
        }

        String allowedOrigins = pathEntry.getAllowedOrigins();
        if (StringUtils.isBlank(allowedOrigins)) {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.allowedOrigins.cannot.be.empty"), pathEntry.getName());
        }
        corsConfiguration.setMaxAge(maxAge);
        corsConfiguration.setAllowedOrigins(toList(allowedOrigins));
        corsConfiguration.setAllowedMethods(toList(DEFAULT_ALLOWED_METHODS));
        corsConfiguration.setAllowedHeaders(toList(DEFAULT_ALLOWED_HEADERS));
        corsConfiguration.setExposedHeaders(toList(DEFAULT_EXPOSED_HEADERS));
        corsConfiguration.setAllowCredentials(allowCredentials);
        return corsConfiguration;
    }

    private List<String> toList(String inputString) {
        return Arrays.asList(StringUtils.split(inputString, ","));
    }


    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        return bean;
    }
}
