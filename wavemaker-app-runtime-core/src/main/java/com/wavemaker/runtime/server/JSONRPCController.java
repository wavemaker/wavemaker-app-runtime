/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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
package com.wavemaker.runtime.server;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.JsonView;

import com.wavemaker.runtime.server.view.TypedView;
import com.wavemaker.runtime.service.ServiceWire;
import com.wavemaker.runtime.service.TypedServiceReturn;
import com.wavemaker.runtime.service.response.ErrorResponse;
import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.WMException;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.json.JSONArray;
import com.wavemaker.studio.json.JSONObject;
import com.wavemaker.studio.json.JSONUnmarshaller;
import com.wavemaker.studio.json.type.reflect.ReflectTypeUtils;

/**
 * Controller (in the MVC sense) implementing a JSON interface and view onto the AG framework.
 * 
 * @author Matt Small
 */
public class JSONRPCController extends ControllerBase {

    /** Logger for this class and subclasses */
    protected final Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    protected ModelAndView executeRequest(HttpServletRequest request, HttpServletResponse response) throws IOException, WMException {

        TypedServiceReturn reflInvokeRef=null;
        if("get".equals(request.getMethod().toLowerCase())) {
            handleGetRequest(request, response);
            return null;
        }

        String serviceName = ServerUtils.getServiceName(request);
        ModelAndView ret = null;
        String method = null;
        JSONArray params = null;

        String input;
        if (request.getContentLength() == 0 || request.getInputStream() == null) {
            input = "";
        } else {
            input = ServerUtils.readInput(request);
        }

        this.logger.debug("Request body: '{}'",input);

        JSONObject jsonReq = (JSONObject) JSONUnmarshaller.unmarshal(input, getInternalRuntime().getJSONState());

        if (jsonReq == null) {
            throw new WMRuntimeException(MessageResource.FAILED_TO_PARSE_REQUEST, input);
        } else if (!jsonReq.containsKey(ServerConstants.METHOD) || !jsonReq.containsKey(ServerConstants.ID)) {
            throw new WMRuntimeException(MessageResource.SERVER_NOMETHODORID, input);
        }

        method = (String) jsonReq.get(ServerConstants.METHOD);
        params = null;
        if (jsonReq.containsKey(ServerConstants.PARAMETERS)) {
            Object rawParams = jsonReq.get(ServerConstants.PARAMETERS);

            if (rawParams instanceof JSONArray) {
                params = (JSONArray) rawParams;
            } else if (rawParams == null) {
                params = new JSONArray();
            } else if (rawParams instanceof JSONObject) {
                JSONObject tjo = (JSONObject) rawParams;
                if (tjo.isEmpty()) {
                    params = new JSONArray();
                } else {
                    throw new WMRuntimeException(MessageResource.JSONRPC_CONTROLLER_BAD_PARAMS_NON_EMPTY, tjo, jsonReq);
                }
            } else {
                throw new WMRuntimeException(MessageResource.JSONRPC_CONTROLLER_BAD_PARAMS_UNKNOWN_TYPE, rawParams.getClass(), jsonReq);
            }
        } else {
            params = new JSONArray();
        }

        this.logger.info("Invoke Service: {} , Method: {}", serviceName, method);
        this.logger.debug("Method {},Parameters: {}", method, params);

        ServiceWire sw = this.getServiceManager().getServiceWire(serviceName);
        if (sw == null) {
            throw new WMRuntimeException(MessageResource.NO_SERVICEWIRE, serviceName);
        }


        reflInvokeRef = invokeMethod(sw, method, params, null, this.serviceResponse);


        this.logger.debug("method {},result: {}", method, reflInvokeRef);

        JsonView jv = getView();
        ret = getModelAndView(jv, reflInvokeRef);

        return ret;
    }

    @Override
    protected JsonView getView() {

        JsonView ret = new JsonView();
        ret.setJsonConfig(getInternalRuntime().getJSONState());
        return ret;
    }

    @Override
    protected ModelAndView handleError(final String message, Throwable t) {

        TypedView view = getView();

        ErrorResponse er = new ErrorResponse() {

            @Override
            public String getError() {
                return message;
            }
        };

        TypedServiceReturn tsr = new TypedServiceReturn();
        tsr.setReturnValue(er);
        tsr.setReturnType(ReflectTypeUtils.getFieldDefinition(er.getClass(), getInternalRuntime().getJSONState().getTypeState(), false, null));

        return getModelAndView(view, tsr);
    }
}
