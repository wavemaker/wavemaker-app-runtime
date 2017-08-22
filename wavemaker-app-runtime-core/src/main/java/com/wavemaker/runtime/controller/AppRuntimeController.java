/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.controller;

import java.io.InputStream;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.wavemaker.commons.wrapper.StringWrapper;
import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.service.AppRuntimeService;
import com.wavemaker.runtime.service.AppRuntimeServiceImpl;

/**
 * @author Sowmya
 */

@RestController
@RequestMapping("/")
public class AppRuntimeController {

    @Autowired
    private AppRuntimeService appRuntimeService;

    @RequestMapping(value = "/application/type", method = RequestMethod.GET)
    public StringWrapper getApplicationType() {
        String applicationType = appRuntimeService.getApplicationType();
        return new StringWrapper(applicationType);
    }

    // XXX restrict this method in app runtime.
    @RequestMapping(method = RequestMethod.POST, value = "/{serviceId}/queries/test_run")
    public DesignServiceResponse testRunQuery(
            @PathVariable("serviceId") String serviceId, MultipartHttpServletRequest request, Pageable pageable) {
        return appRuntimeService.testRunQuery(serviceId, request, pageable);
    }

    @RequestMapping(method = RequestMethod.POST, value = "{serviceId}/procedures/test_run")
    public DesignServiceResponse testRunProcedure(
            @PathVariable("serviceId") String serviceId, @RequestBody RuntimeProcedure procedure) {
        return appRuntimeService.testRunProcedure(serviceId, procedure);
    }

    @RequestMapping(method = RequestMethod.POST, value = "/{serviceId}/queries/execute")
    public Object executeQuery(
            @PathVariable("serviceId") String serviceId, @RequestBody RuntimeQuery query, Pageable pageable) {
        return appRuntimeService.executeQuery(serviceId, query, pageable);
    }

    @RequestMapping(value = "/application/i18n", method = RequestMethod.GET)
    public void getLocaleMessages(HttpServletRequest request, HttpServletResponse response) {
        appRuntimeService.getLocaleMessages(request, response);
    }

    @RequestMapping(value = "/application/i18n/{locale}", method = RequestMethod.GET)
    public void getLocaleMessages(@PathVariable("locale") String locale, HttpServletResponse response) {
        appRuntimeService.getLocaleMessages(locale, response);
    }

    @RequestMapping(value = "/application/validations", method = RequestMethod.GET)
    public DownloadResponse getValidations(HttpServletResponse httpServletResponse) {
        InputStream inputStream = appRuntimeService.getValidations(httpServletResponse);
        DownloadResponse downloadResponse = new DownloadResponse(inputStream, MediaType.APPLICATION_JSON_VALUE, AppRuntimeServiceImpl.DB_VALIDATIONS_JSON_FILE);
        downloadResponse.setInline(true);
        return downloadResponse;
    }
}

