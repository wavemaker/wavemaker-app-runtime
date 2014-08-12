package com.wavemaker.runtime.rest.controller;

import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.wavemaker.common.util.Tuple;
import com.wavemaker.runtime.helper.SchemaConversionHelper;
import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.runtime.rest.service.RestConnector;
import com.wavemaker.runtime.rest.service.RestRuntimeService;
import net.sf.json.JSON;

/**
 * @author Uday Shankar
 */
@Controller
public class RestRuntimeController {

    @Autowired
    private RestRuntimeService restRuntimeService;

    @RequestMapping(value = "/{serviceId}/{operationId}",method = RequestMethod.POST)
    @ResponseBody
    public RestResponse executeRestCall(@PathVariable("serviceId") String serviceId, @PathVariable("operationId") String operationId,
                                        @RequestBody Map<String, String> params) throws IOException {
        //restRuntimeService.validateOperation(serviceId, operationId, httpServletRequest.getMethod());
        return restRuntimeService.executeRestCall(serviceId, operationId, params);
    }


}
