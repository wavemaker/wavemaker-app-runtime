package com.wavemaker.runtime.rest.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.runtime.rest.service.RestRuntimeService;

/**
 * @author Uday Shankar
 */
@RestController
public class RestRuntimeController {

    @Autowired
    private RestRuntimeService restRuntimeService;

    @RequestMapping(value = "/{serviceId}/{operationId}",method = RequestMethod.POST)
    public RestResponse executeRestCall(@PathVariable("serviceId") String serviceId, @PathVariable("operationId") String operationId,
                                        @RequestBody Map<String, Object> params) throws IOException {
        return restRuntimeService.executeRestCall(serviceId, operationId, params);
    }


}
