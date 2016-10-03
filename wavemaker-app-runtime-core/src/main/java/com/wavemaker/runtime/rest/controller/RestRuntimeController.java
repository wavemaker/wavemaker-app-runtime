/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.rest.controller;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.util.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.HandlerMapping;

import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.runtime.rest.service.RestRuntimeService;
import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.IOUtils;

/**
 * @author Uday Shankar
 */
public class RestRuntimeController {

    @Autowired
    private RestRuntimeService restRuntimeService;

    private static final String WM_HEADER_PREFIX = "X-WM-";

    public void handleRequest(final HttpServletRequest request, final HttpServletResponse response) throws Exception {
        String pathInfo = request.getPathInfo();
        String[] split = pathInfo.split("/");
        if (split.length < 3) {
            throw new WMRuntimeException("Invalid Rest Service Url");
        }
        final String serviceId = split[1];
        if (StringUtils.isBlank(serviceId)) {
            throw new WMRuntimeException("ServiceId is empty");
        }
        final String operationId = split[2];
        if (StringUtils.isBlank(operationId)) {
            throw new WMRuntimeException("operationId is empty");
        }

        Map<String, String> decodedUriVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);

        executeRestCall(serviceId, operationId, decodedUriVariables, request, response);
    }

    private void executeRestCall(String serviceId, String methodName,
                                 Map<String, String> decodedUriVariables, HttpServletRequest httpServletRequest,
                                 HttpServletResponse httpServletResponse) throws IOException {
        Map<String, Object> params = new HashMap<>();
        addHeaders(httpServletRequest, params);
        addRequestParams(httpServletRequest, params);
        addRequestBody(httpServletRequest, params);
        addPathParams(decodedUriVariables, params);
        RestResponse restResponse = restRuntimeService.executeRestCall(serviceId, methodName, params, httpServletRequest);
        Map<String,List<String>> responseHeaders = restResponse.getResponseHeaders();
        String s[] = {"Cache-Control", "Last-Modified", "Content-Disposition", "Accept-Ranges"};
        List<String> defaultResponseHeadersList = Arrays.asList(s);
        for (String responseHeaderKey : responseHeaders.keySet()) {
            String updatedResponseHeaderKey = WM_HEADER_PREFIX+ responseHeaderKey;
            if(defaultResponseHeadersList.contains(responseHeaderKey)) {
                updatedResponseHeaderKey = responseHeaderKey;
            }
            List<String> responseHeaderValueList = responseHeaders.get(responseHeaderKey);
            for (String responseHeaderValue : responseHeaderValueList) {
                httpServletResponse.setHeader(updatedResponseHeaderKey, responseHeaderValue);
            }
        }
        byte[] responseBody = restResponse.getResponseBody();
        responseBody = (responseBody == null) ? "".getBytes() : responseBody;
        int statusCode = restResponse.getStatusCode();
        if (statusCode >= 200 && statusCode<= 299) {
            if (StringUtils.isNotBlank(restResponse.getContentType())) {
                httpServletResponse.setContentType(restResponse.getContentType());
            }
            httpServletResponse.setHeader("X-WM-STATUS_CODE", String.valueOf(statusCode));
            IOUtils.copy(new ByteArrayInputStream(responseBody), httpServletResponse.getOutputStream(), true, false);
        } else {
            throw new WMRuntimeException(MessageResource.REST_SERVICE_INVOKE_FAILED, statusCode, new String(responseBody).intern());
        }
    }

    private void addPathParams(Map<String, String> decodedUriVariables, Map<String, Object> params) {
        params.putAll(decodedUriVariables);
    }

    private void addHeaders(HttpServletRequest httpServletRequest, Map<String, Object> params) {
        Enumeration headerNames = httpServletRequest.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = (String) headerNames.nextElement();
            String key = headerName;
            if (headerName.toUpperCase().startsWith(WM_HEADER_PREFIX)) {
                key = headerName.substring(5);
            } else if (httpServletRequest.getHeader(WM_HEADER_PREFIX + headerName) != null || httpServletRequest.getHeader(WM_HEADER_PREFIX.toLowerCase() + headerName) != null) {
                //Ignoring the header as its corresponding wmHeader is present in the request
                continue;
            }
            String value = httpServletRequest.getHeader(headerName);
            updateParams(params, key, value);
        }
    }

    private void addRequestParams(HttpServletRequest httpServletRequest, Map<String, Object> params) {
        Enumeration parameterNames = httpServletRequest.getParameterNames();
        while (parameterNames.hasMoreElements()) {
            String parameterName = (String) parameterNames.nextElement();
            updateParams(params, parameterName, httpServletRequest.getParameter(parameterName));
        }
    }

    private void addRequestBody(HttpServletRequest httpServletRequest, Map<String, Object> params) throws IOException {
        String method = httpServletRequest.getMethod();
        if (!StringUtils.equals(method, HttpMethod.GET.name()) && !StringUtils.equals(method, HttpMethod.HEAD.name())) {
            StringWriter writer = new StringWriter();
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            IOUtils.copy(httpServletRequest.getInputStream(), byteArrayOutputStream, true, true);
            updateParams(params, RestConstants.REQUEST_BODY_KEY, byteArrayOutputStream.toString());
        }
    }

    private void updateParams(Map<String, Object> params, String key, String value) {
        Object o = params.get(key);
        if (o == null) {
            params.put(key, value);
        } else {
            if (o instanceof String) {
                String prevValue = (String) o;
                ArrayList<Object> objects = new ArrayList<>();
                objects.add(prevValue);
                o = objects;
            }
            ((List) o).add(value);
        }
    }
}
