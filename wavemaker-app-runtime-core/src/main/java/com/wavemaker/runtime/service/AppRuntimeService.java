package com.wavemaker.runtime.service;

import java.io.InputStream;

import javax.servlet.http.HttpServletRequest;
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

    String getApplicationType();

    DesignServiceResponse testRunQuery(String serviceId, MultipartHttpServletRequest request, Pageable pageable);

    DesignServiceResponse testRunProcedure(String serviceId, RuntimeProcedure procedure);

    Object executeQuery(String serviceId, RuntimeQuery query, Pageable pageable);

    void getLocaleMessages(HttpServletRequest request, HttpServletResponse response);

    void getLocaleMessages(String language, HttpServletResponse response);

    InputStream getValidations(HttpServletResponse response);
}