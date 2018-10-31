package com.wavemaker.runtime.service;

import java.io.InputStream;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;

/**
 * Created by Kishore Routhu on 21/6/17 2:57 PM.
 */
public interface AppRuntimeService {

    Map<String, Object> getApplicationProperties();

    String getApplicationType();

    DesignServiceResponse testRunQuery(String serviceId, MultipartHttpServletRequest request, Pageable pageable);

    DesignServiceResponse testRunProcedure(String serviceId, RuntimeProcedure procedure);

    Object executeQuery(String serviceId, RuntimeQuery query, Pageable pageable);

    InputStream getValidations(HttpServletResponse response);
}