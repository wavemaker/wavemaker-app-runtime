package com.wavemaker.runtime.web.servlet;

import java.io.IOException;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.httpclient.HttpStatus;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.commons.util.HttpRequestUtils;

/**
 * Created by kishore on 24/3/17.
 */
public class PrefabWebContentServlet extends HttpServlet {

    private static final Logger LOGGER = LoggerFactory.getLogger(PrefabWebContentServlet.class);

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String prefabResourcePath = request.getPathInfo();
        if (StringUtils.isBlank(prefabResourcePath)) {
            writeErrorResponse(request, response, prefabResourcePath);
            return;
        }

        if (prefabResourcePath.startsWith("/")) {
            prefabResourcePath = prefabResourcePath.substring(1);
        }

        int endIndex = prefabResourcePath.indexOf("/");
        if (endIndex == -1) {
            writeErrorResponse(request, response, prefabResourcePath);
            return;
        }

        String prefabName = prefabResourcePath.substring(0, endIndex);
        String resourceRelativePath = prefabResourcePath.substring(prefabName.length());
        String prefabResourceUpdatedPath = "/WEB-INF/prefabs/" + prefabName + "/webapp" + resourceRelativePath;
        RequestDispatcher requestDispatcher = getServletContext().getRequestDispatcher(prefabResourceUpdatedPath);
        requestDispatcher.forward(request, response);
    }

    private void writeErrorResponse(HttpServletRequest request, HttpServletResponse response, String prefabResourcePath) throws IOException {
        LOGGER.warn("Invalid prefab uri {} received", request.getRequestURI());
        HttpRequestUtils.writeJsonErrorResponse("Invalid prefab url " + request.getRequestURI(), HttpStatus.SC_BAD_REQUEST, response);
    }
}
