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
package com.wavemaker.runtime.security;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;

import com.wavemaker.runtime.WMObjectMapper;
import com.wavemaker.commons.CommonConstants;
import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.core.web.rest.ErrorResponse;
import com.wavemaker.commons.core.web.rest.ErrorResponses;

/**
 * Created by kishorer on 4/7/16.
 */
public class WMAppAccessDeniedHandler extends AccessDeniedHandlerImpl {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException, ServletException {
        if(com.wavemaker.runtime.util.HttpRequestUtils.isAjaxRequest(request)) {
            String exceptionMessage = accessDeniedException.getMessage();
            Map<String, Object> errorMap = new HashMap(1);
            ErrorResponse errorResponse = new ErrorResponse();
            errorResponse.setMessageKey(MessageResource.ACCESS_DENIED.getMessageKey());
            errorResponse.setParameters(Arrays.asList(exceptionMessage));
            List<ErrorResponse> errorResponseList = new ArrayList<>(1);
            errorResponseList.add(errorResponse);
            errorMap.put("errors", new ErrorResponses(errorResponseList));
            request.setCharacterEncoding(CommonConstants.UTF8);
            response.setHeader("Cache-Control", "no-cache");
            response.setDateHeader("Expires", 0);
            response.setHeader("Pragma", "no-cache");
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("text/plain;charset=utf-8");
            PrintWriter writer = response.getWriter();
            writer.write(WMObjectMapper.getInstance().writeValueAsString(errorMap));
            writer.flush();
        } else {
            super.handle(request, response, accessDeniedException);
        }
    }
}
