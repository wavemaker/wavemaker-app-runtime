package com.wavemaker.studio.prefab.web;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

import org.springframework.http.HttpRequest;

/**
 * @author Uday Shankar
 */
public class PrefabAwareHttpRequestWrapper extends HttpServletRequestWrapper {

    private String prefabName;

    /**
     * Creates a new {@code HttpRequest} wrapping the given request object.
     *
     * @param request the request object to be wrapped
     * @param prefabName
     */
    public PrefabAwareHttpRequestWrapper(HttpServletRequest request, String prefabName) {
        super(request);
        this.prefabName = prefabName;
    }

    @Override
    public String getPathInfo() {
        String pathInfo = super.getPathInfo();
        if (pathInfo.startsWith("/" + prefabName)) {
            return pathInfo.substring(prefabName.length() + 1);
        } else {
            return pathInfo;
        }
    }


}
