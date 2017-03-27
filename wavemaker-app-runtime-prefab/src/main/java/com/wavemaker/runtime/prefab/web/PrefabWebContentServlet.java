package com.wavemaker.runtime.prefab.web;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.IOUtils;

/**
 * Created by kishore on 24/3/17.
 */
public class PrefabWebContentServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String requestURL = getRequestURL(request);
        String prefabResourcePath = getPrefabResourcePath(requestURL);

        InputStream resourceStream = readResource(request, prefabResourcePath);
        OutputStream outputStream = response.getOutputStream();
        IOUtils.copy(resourceStream, outputStream, true, false);
    }

    private String getRequestURL(HttpServletRequest request) {
        StringBuffer requestURL = request.getRequestURL();
        String contextPath = request.getContextPath();
        return requestURL.substring(requestURL.lastIndexOf(contextPath) + contextPath.length());
    }

    private static String getPrefabResourcePath(String requestURL) {
        int startIndex =  "/app/prefabs/".length();
        String prefabResourcePath = requestURL.substring(startIndex);

        int endIndex = prefabResourcePath.indexOf("/");
        if (endIndex == -1) {
            throw new WMRuntimeException("Invalid path of requested resource " + prefabResourcePath);
        }

        String prefabName = prefabResourcePath.substring(0, endIndex);
        String resourcePath = prefabResourcePath.substring(prefabName.length());
        return "WEB-INF/prefabs/" + prefabName + "/webapp" + resourcePath;
    }

    private InputStream readResource(HttpServletRequest request, String resourcePath) {
        ServletContext context = request.getSession().getServletContext();
        InputStream inputStream = context.getResourceAsStream(resourcePath);

        if (inputStream == null) {
            throw new WMRuntimeException("Resource not found at " + resourcePath);
        }
        return inputStream;
    }
}
