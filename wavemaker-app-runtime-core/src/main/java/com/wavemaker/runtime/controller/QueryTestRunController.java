package com.wavemaker.runtime.controller;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.service.QueryDesignService;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/3/19
 */
@RestController
@RequestMapping("/")
public class QueryTestRunController {

    private static final Logger LOGGER = LoggerFactory.getLogger(QueryTestRunController.class);

    @Autowired
    private QueryDesignService queryDesignService;

    @PostConstruct
    public void init() {
        LOGGER.info("-------------Query Test Controller enabled----------");
    }

    @RequestMapping(method = RequestMethod.POST, value = "/{serviceId}/queries/test_run")
    public DesignServiceResponse testRunQuery(
            @PathVariable("serviceId") String serviceId, MultipartHttpServletRequest request, Pageable pageable) {
        return queryDesignService.testRunQuery(serviceId, request, pageable);
    }

    @RequestMapping(method = RequestMethod.POST, value = "/{serviceId}/queries/execute")
    public Object executeQuery(
            @PathVariable("serviceId") String serviceId, @RequestBody RuntimeQuery query, Pageable pageable) {
        return queryDesignService.executeQuery(serviceId, query, pageable);
    }

}
