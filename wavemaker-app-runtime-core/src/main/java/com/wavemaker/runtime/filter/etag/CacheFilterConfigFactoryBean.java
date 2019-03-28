package com.wavemaker.runtime.filter.etag;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.util.CollectionUtils;

/**
 * Created by srujant on 26/3/19.
 */
public class CacheFilterConfigFactoryBean implements FactoryBean<CacheFilterConfig> {

    @Value("${app.build.ui.mode}")
    private String buildMode;

    @Value("${app.build.ui.ng.args}")
    private String buildArgs;

    @Override
    public CacheFilterConfig getObject() throws Exception {
        CacheFilterConfig cacheFilterConfig = new CacheFilterConfig();
        if ("angular".equals(buildMode) && StringUtils.isNotBlank(buildArgs)) {
            if (buildArgs.contains("--prod=true")) {
                cacheFilterConfig.setCacheRequestMatcher(getOrRequestMatcher(Arrays.asList("/ng-bundle/**")));
            }
        }
        cacheFilterConfig.setEtagRequestMatcher(getOrRequestMatcher(Arrays.asList("/**")));
        return cacheFilterConfig;
    }

    @Override
    public Class<?> getObjectType() {
        return CacheFilterConfig.class;
    }

    private RequestMatcher getOrRequestMatcher(List<String> urlPatterns) {
        if (CollectionUtils.isEmpty(urlPatterns))
            return null;

        List<RequestMatcher> antPathRequestMatchers = new ArrayList<>();
        for (String pattern : urlPatterns) {
            antPathRequestMatchers.add(new AntPathRequestMatcher(pattern, HttpMethod.GET.name()));
        }
        return new OrRequestMatcher(antPathRequestMatchers);
    }

}
