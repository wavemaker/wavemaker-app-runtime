package com.wavemaker.runtime.service;

import java.io.InputStream;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

/**
 * Created by Kishore Routhu on 21/6/17 2:57 PM.
 */
public interface AppRuntimeService {

    Map<String, Object> getApplicationProperties();

    String getApplicationType();

    InputStream getValidations(HttpServletResponse response);
}