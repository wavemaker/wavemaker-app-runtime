package com.wavemaker.runtime.prefab.web;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.wavemaker.commons.util.IOUtils;

/**
 * Created by kishore on 24/3/17.
 */
public class PrefabWebContentServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String requestURL = getRequestURL(request);
        String prefabResourcePath = getPrefabResourcePath(requestURL);

        byte[] resourceData = readResource(request, prefabResourcePath);
        response.setContentLength(resourceData.length);

        OutputStream outputStream = response.getOutputStream();
        IOUtils.copy(new ByteArrayInputStream(resourceData), outputStream, true, false);
    }

    private String getRequestURL(HttpServletRequest request) {
        StringBuffer requestURL = request.getRequestURL();
        String contextPath = request.getContextPath();
        return requestURL.substring(requestURL.lastIndexOf(contextPath) + contextPath.length());
    }

    private static String getPrefabResourcePath(String requestURL) {
        int startIndex =  "/app/prefabs/".length();
        String prefabResourcePath = requestURL.substring(startIndex);

        String prefabName = prefabResourcePath.substring(0, prefabResourcePath.indexOf("/"));
        String resourcePath = prefabResourcePath.substring(prefabName.length());
        return "WEB-INF/prefabs/" + prefabName + "/webapp" + resourcePath;
    }

    private byte[] readResource(HttpServletRequest request, String resourcePath) {
        ServletContext context = request.getSession().getServletContext();
        InputStream resourceStream = null;
        try {
            resourceStream = context.getResourceAsStream(resourcePath);
            String resourceData = IOUtils.toString(resourceStream);
            return resourceData.getBytes();
        } finally {
            IOUtils.closeSilently(resourceStream);
        }
    }
}
