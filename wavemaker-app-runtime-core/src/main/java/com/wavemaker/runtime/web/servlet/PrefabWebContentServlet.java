package com.wavemaker.runtime.web.servlet;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.InvalidPathException;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.wavemaker.commons.ResourceNotFoundException;
import com.wavemaker.commons.util.IOUtils;

/**
 * Created by kishore on 24/3/17.
 */
public class PrefabWebContentServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String requestURL = getRequestURL(request);
        String prefabResourceUrl = getPrefabResourcePath(requestURL);
        RequestDispatcher requestDispatcher = getServletContext().getRequestDispatcher(prefabResourceUrl);
        requestDispatcher.forward(request, response);
    }

    private String getRequestURL(HttpServletRequest request) {
        StringBuffer requestURL = request.getRequestURL();
        String contextPath = request.getContextPath();
        return requestURL.substring(requestURL.lastIndexOf(contextPath) + contextPath.length());
    }

    private static String getPrefabResourcePath(String requestURL) throws InvalidPathException {
        int startIndex =  "/app/prefabs/".length();
        String prefabResourcePath = requestURL.substring(startIndex);

        int endIndex = prefabResourcePath.indexOf("/");
        if (endIndex == -1) {
            throw new InvalidPathException(prefabResourcePath, "Invalid resouce path " );
        }

        String prefabName = prefabResourcePath.substring(0, endIndex);
        String resourcePath = prefabResourcePath.substring(prefabName.length());
        return "/WEB-INF/prefabs/" + prefabName + "/webapp" + resourcePath;
    }
}
