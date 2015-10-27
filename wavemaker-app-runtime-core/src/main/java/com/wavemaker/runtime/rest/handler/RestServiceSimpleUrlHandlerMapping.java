package com.wavemaker.runtime.rest.handler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;

import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.handler.SimpleUrlHandlerMapping;

import com.wavemaker.runtime.rest.model.RestServiceInfoBean;

/**
 * Created by ArjunSahasranam on 7/10/15.
 */

/**
 * This accepts/rejects requests based on URL match pattern and HTTP Methods.
 */

public class RestServiceSimpleUrlHandlerMapping extends SimpleUrlHandlerMapping {
    private final Map<String, List<String>> urlToHttpMethodMap = new HashMap<>();

    public Map<String, List<String>> getUrlToHttpMethodMap() {
        return urlToHttpMethodMap;
    }

    public void addRestServiceInfoBean(final RestServiceInfoBean restServiceInfoBean, final String controller) {
        final String url = restServiceInfoBean.getUrl();
        final String httpMethod = restServiceInfoBean.getHttpMethod();
        final Map<String, ?> urlMap = getUrlMap();

        Map<String, Object> map = new HashMap<>();
        map.put(url, controller);
        map.putAll(urlMap);
        setUrlMap(map);

        List<String> httpMethodList = new ArrayList<>();
        httpMethodList.add(httpMethod);
        getUrlToHttpMethodMap().put(url, httpMethodList);
    }

    @Override
    protected void validateHandler(final Object handler, final HttpServletRequest request) throws Exception {
        final Map<String, List<String>> urlMap = getUrlToHttpMethodMap();
        String pathInfo = request.getPathInfo();
        String method = request.getMethod();
        for (String configUrl : urlMap.keySet()) {
            List<String> configMethods = urlMap.get(configUrl);
            if (configUrl.equals(pathInfo) && !configMethods.contains(method)) {
                throw new HttpRequestMethodNotSupportedException(request.getMethod(), configMethods);
            }
        }
    }
}
