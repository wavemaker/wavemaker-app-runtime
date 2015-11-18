package com.wavemaker.runtime.rest.controller;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.AbstractController;
import org.springframework.web.servlet.view.AbstractView;

import com.wavemaker.runtime.rest.RestConstants;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.runtime.rest.service.RestRuntimeService;
import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.IOUtils;

/**
 * @author Uday Shankar
 */
public class RestRuntimeController extends AbstractController {

    @Autowired
    private RestRuntimeService restRuntimeService;

    public RestRuntimeController() {
        setSupportedMethods(null);//This is to support all http methods instead of default supported methods get,post and head
    }

    @Override
    protected ModelAndView handleRequestInternal(
            final HttpServletRequest request, final HttpServletResponse response) throws Exception {
        final String pathInfo = request.getPathInfo();
        final int index = pathInfo.lastIndexOf('/');
        final String serviceId = getServiceId(pathInfo.substring(1, index));
        final String operation = pathInfo.substring(index + 1, pathInfo.length());
        executeRestCall(serviceId, operation, request, response);
        return new ModelAndView(new NoOpView(), new HashMap<String,Object>());
    }

    private void executeRestCall(String serviceId, String operationId,
                                HttpServletRequest httpServletRequest,
                                HttpServletResponse httpServletResponse) throws IOException {
        Map<String, Object> params = new HashMap();
        addHeaders(httpServletRequest, params);
        addRequestParams(httpServletRequest, params);
        addRequestBody(httpServletRequest, params);
        RestResponse restResponse = restRuntimeService.executeRestCall(serviceId, operationId, params);
        Map<String,List<String>> responseHeaders = restResponse.getResponseHeaders();
        for (String responseHeaderKey : responseHeaders.keySet()) {
            String updatedResponseHeaderKey = "X-WM-"+ responseHeaderKey;
            List<String> responseHeaderValueList = responseHeaders.get(responseHeaderKey);
            for (String responseHeaderValue : responseHeaderValueList) {
                httpServletResponse.setHeader(updatedResponseHeaderKey, responseHeaderValue);
            }
        }
        String responseBody = restResponse.getResponseBody();
        responseBody = (responseBody != null) ? responseBody : restResponse.getConvertedResponse();
        int statusCode = restResponse.getStatusCode();
        if (statusCode >= 200 && statusCode<= 299) {
            if (StringUtils.isNotBlank(restResponse.getContentType())) {
                httpServletResponse.setContentType(restResponse.getContentType());
            }
            httpServletResponse.setHeader("X-WM-STATUS_CODE", String.valueOf(statusCode));
            responseBody = (responseBody == null) ? "" : responseBody;
            IOUtils.copy(new ByteArrayInputStream(responseBody.getBytes()), httpServletResponse.getOutputStream(), true, false);
        } else {
            throw new WMRuntimeException(MessageResource.REST_SERVICE_INVOKE_FAILED, statusCode, responseBody);
        }
    }

    private void addHeaders(HttpServletRequest httpServletRequest, Map<String, Object> params) {
        Enumeration headerNames = httpServletRequest.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = (String) headerNames.nextElement();
            updateParams(params, headerName, httpServletRequest.getHeader(headerName));
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

    /**
     * Returns serviceIds from path for imported artifacts like prefab else returns path as it is.
     *
     * @param path
     * @return serviceId
     */
    private String getServiceId(String path) {
        final int index = path.lastIndexOf('/');
        if (index != -1) {
            final String serviceIdForImportedArtifacts = path.substring(index + 1, path.length());
            return serviceIdForImportedArtifacts;
        }
        return path;
    }

    static class NoOpView extends AbstractView {
        @Override
        protected void renderMergedOutputModel(
                final Map<String, Object> model, final HttpServletRequest request,
                final HttpServletResponse response) throws Exception {

        }
    }
}
