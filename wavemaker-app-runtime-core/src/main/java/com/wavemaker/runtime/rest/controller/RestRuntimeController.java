/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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
import java.io.IOException;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;

import com.wavemaker.runtime.rest.model.HttpResponseDetails;
import com.wavemaker.runtime.rest.service.RestRuntimeService;
import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.IOUtils;

/**
 * @author Uday Shankar
 */
public class RestRuntimeController {

    @Autowired
    private RestRuntimeService restRuntimeService;

    public void handleRequest(final HttpServletRequest httpServletRequest, final HttpServletResponse httpServletResponse) throws Exception {
        String pathInfo = httpServletRequest.getPathInfo();
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

        executeRestCall(serviceId, operationId, httpServletRequest, httpServletResponse);
    }

    private void executeRestCall(String serviceId, String operationId,
                                 HttpServletRequest httpServletRequest,
                                 HttpServletResponse httpServletResponse) throws IOException {
        HttpResponseDetails httpResponseDetails;
        try {
            httpResponseDetails = restRuntimeService.executeRestCall(serviceId, operationId, httpServletRequest);
        } catch (Throwable e) {
            throw new WMRuntimeException(MessageResource.REST_SERVICE_INVOKE_FAILED, e);
        }
        Map<String, List<String>> responseHeaders = httpResponseDetails.getHeaders();

        for (String responseHeaderKey : responseHeaders.keySet()) {
            List<String> responseHeaderValueList = responseHeaders.get(responseHeaderKey);
            for (String responseHeaderValue : responseHeaderValueList) {
                httpServletResponse.setHeader(responseHeaderKey, responseHeaderValue);
            }
        }
        byte[] responseBody = httpResponseDetails.getResponseBody();
        responseBody = (responseBody == null) ? "".getBytes() : responseBody;
        httpServletResponse.setStatus(httpResponseDetails.getStatusCode());
        IOUtils.copy(new ByteArrayInputStream(responseBody), httpServletResponse.getOutputStream(), true, false);
    }
}
