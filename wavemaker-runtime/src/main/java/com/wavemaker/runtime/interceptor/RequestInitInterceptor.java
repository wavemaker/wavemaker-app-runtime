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
package com.wavemaker.runtime.interceptor;

import java.io.File;
import java.sql.Blob;
import java.sql.Clob;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import com.wavemaker.runtime.RuntimeAccess;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.server.InternalRuntime;
import com.wavemaker.runtime.server.json.converters.BlobTypeDefinition;
import com.wavemaker.runtime.server.json.converters.ClobTypeDefinition;
import com.wavemaker.studio.json.JSONState;
import com.wavemaker.studio.json.type.reflect.converters.DateTypeDefinition;
import com.wavemaker.studio.json.type.reflect.converters.FileTypeDefinition;

/**
 * @author Uday Shankar
 */
public class RequestInitInterceptor implements HandlerInterceptor {


    private RuntimeAccess runtimeAccess;

    private InternalRuntime internalRuntime;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        preHandle(request, response, getRuntimeAccess(), getInternalRuntime());
        return true;
    }

    public static void preHandle(HttpServletRequest request, HttpServletResponse response, RuntimeAccess runtimeAccess, InternalRuntime internalRuntime) {
        WMAppContext.getInstance().init(request);
        RuntimeAccess.setRuntimeBean(runtimeAccess);
        InternalRuntime.setInternalRuntimeBean(internalRuntime);

        runtimeAccess.setRequest(request);
        runtimeAccess.setResponse(response);
        initializeRuntimeController(request, internalRuntime);
    }

    /**
     * Perform runtime initialization, after the base runtime has been initialized.
     *
     * @param request The current request.
     * @param internalRuntime
     */
    private static void initializeRuntimeController(HttpServletRequest request, InternalRuntime internalRuntime) {
        JSONState jsonConfig = createJSONState();
        internalRuntime.setJSONState(jsonConfig);
    }

    /**
     * Create the default JSONState.
     *
     * @return
     */
    public static JSONState createJSONState() {

        JSONState jsonState = new JSONState();

        jsonState.setCycleHandler(JSONState.CycleHandler.NO_PROPERTY);

        // value conversions
        jsonState.getTypeState().addType(new DateTypeDefinition(java.util.Date.class));
        jsonState.getTypeState().addType(new DateTypeDefinition(java.sql.Date.class));
        jsonState.getTypeState().addType(new DateTypeDefinition(java.sql.Timestamp.class));
        jsonState.getTypeState().addType(new DateTypeDefinition(java.sql.Time.class));

        jsonState.getTypeState().addType(new FileTypeDefinition(File.class));
        jsonState.getTypeState().addType(new BlobTypeDefinition(Blob.class));
        jsonState.getTypeState().addType(new ClobTypeDefinition(Clob.class));

        return jsonState;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        postHandle();
    }

    public static void postHandle() {
        RuntimeAccess.setRuntimeBean(null);
        InternalRuntime.setInternalRuntimeBean(null);
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
    }

    public RuntimeAccess getRuntimeAccess() {
        return runtimeAccess;
    }

    public void setRuntimeAccess(RuntimeAccess runtimeAccess) {
        this.runtimeAccess = runtimeAccess;
    }

    public InternalRuntime getInternalRuntime() {
        return internalRuntime;
    }

    public void setInternalRuntime(InternalRuntime internalRuntime) {
        this.internalRuntime = internalRuntime;
    }
}
